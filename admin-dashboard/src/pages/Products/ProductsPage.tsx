import { useEffect, useState, useRef } from 'react';
import {
  RiAddLine, RiDeleteBinLine, RiFileCopyLine, RiArchiveLine, RiCheckLine, RiCloseLine as RiUnpublishLine,
  RiUploadCloud2Line, RiEdit2Line, RiCloseCircleLine, RiVideoLine, RiStarLine,
} from 'react-icons/ri';
import { api, type PaginatedData } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';

interface ProductImage { id?: string; url: string; isPrimary?: boolean }

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  description?: string;
  brand?: { id: string, name: string } | null;
  category?: { id: string, name: string } | null;
  gender?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  originalPrice?: number;
  variants?: { id: string; videoUrl?: string; images: ProductImage[] }[];
}

interface ProductForm {
  id?: string;
  name: string;
  brandId: string;
  categoryId: string;
  gender: string;
  price: number;
  originalPrice: string;
  stock: number;
  description: string;
  material: string;
  frameShape: string;
  weight: string;
  warranty: string;
  lensWidth: string;
  bridgeWidth: string;
  templeLength: string;
  frameWidth: string;
  status: string;
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
}

const emptyForm: ProductForm = {
  name: '',
  brandId: '',
  categoryId: '',
  gender: 'unisex',
  price: 0,
  originalPrice: '',
  stock: 0,
  description: '',
  material: '',
  frameShape: '',
  weight: '',
  warranty: '',
  lensWidth: '',
  bridgeWidth: '',
  templeLength: '',
  frameWidth: '',
  status: 'PUBLISHED',
  isNew: false,
  isBestseller: false,
  isFeatured: false,
};

// Every image/video attached to a product goes through this one upload path
// (POST /upload/admin), which stores the file in Cloudflare R2 and only ever
// persists the resulting URL — never the file itself — to the database.
async function uploadToR2(file: File, folder = 'products'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const res = await api.post('/upload/admin', formData);
  return res.data.data.url as string;
}

export default function ProductsPage() {
  const [data, setData] = useState<PaginatedData<Product> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string>('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [brands, setBrands] = useState<{ id: string, name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [brandsLoaded, setBrandsLoaded] = useState(false);
  const [quickAddBrand, setQuickAddBrand] = useState({ open: false, name: '', saving: false });

  const loadBrands = () => {
    api.get('/admin/brands?limit=100').then((res) => {
      setBrands(res.data.data?.items || []);
    }).catch(console.error).finally(() => setBrandsLoaded(true));
  };

  useEffect(() => {
    loadBrands();
    api.get('/admin/categories?limit=100').then((res) => {
      setCategories(res.data.data?.items || []);
    }).catch(console.error);
  }, []);

  const load = () => {
    api
      .get('/admin/products', { params: { page, limit: 20, search: search || undefined } })
      .then((res) => setData(res.data.data))
      .catch(() => setError('Could not load products.'));
  };

  useEffect(load, [page, search]);

  const createBrandInline = async () => {
    if (!quickAddBrand.name.trim()) return;
    setQuickAddBrand({ ...quickAddBrand, saving: true });
    try {
      const res = await api.post('/admin/brands', { name: quickAddBrand.name.trim() });
      const newBrand = res.data.data;
      setBrands((prev) => [...prev, { id: newBrand.id, name: newBrand.name }]);
      setForm((f) => ({ ...f, brandId: newBrand.id }));
      setQuickAddBrand({ open: false, name: '', saving: false });
    } catch {
      setError('Could not create brand — check the name is unique.');
      setQuickAddBrand({ ...quickAddBrand, saving: false });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    // getUserMedia only exists in secure contexts (HTTPS, or localhost). If the
    // admin dashboard is opened over plain HTTP on a deployed server or a LAN
    // IP, `navigator.mediaDevices` is simply undefined — the previous code
    // called straight into it and reported a generic "allow permissions"
    // message, which is misleading when the real issue is that the page isn't
    // served securely at all.
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Live capture needs the dashboard to be opened over HTTPS (or localhost). Ask whoever set up hosting to enable HTTPS, or use "Upload Files" instead.');
      return;
    }
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      setCameraError('Could not access the camera. Please allow camera permissions for this site.');
      setCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  // Camera stream must not keep running if the modal is closed some other way.
  useEffect(() => () => stopCamera(), []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setNewImageFiles((prev) => [...prev, file]);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const closeDialog = () => {
    setModalOpen(false);
    setForm(emptyForm);
    setNewImageFiles([]);
    setExistingImages([]);
    setNewVideoFile(null);
    setExistingVideoUrl('');
    setCameraError(null);
    setQuickAddBrand({ open: false, name: '', saving: false });
    stopCamera();
  };

  const saveProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Upload any newly added images/video to R2 first.
      const uploadedImages: ProductImage[] = [];
      for (const file of newImageFiles) {
        const url = await uploadToR2(file, 'products');
        uploadedImages.push({ url });
      }
      let videoUrl = existingVideoUrl || undefined;
      if (newVideoFile) {
        videoUrl = await uploadToR2(newVideoFile, 'products');
      }

      // 2. Combine kept existing images with newly uploaded ones, first image primary.
      const allImages = [...existingImages, ...uploadedImages].map((img, i) => ({
        url: img.url,
        isPrimary: i === 0,
      }));

      const basePayload = {
        name: form.name,
        brandId: form.brandId || undefined,
        categoryId: form.categoryId || undefined,
        gender: form.gender || undefined,
        price: form.price,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: form.stock,
        description: form.description,
        material: form.material || undefined,
        frameShape: form.frameShape || undefined,
        weight: form.weight ? parseInt(form.weight) : undefined,
        warranty: form.warranty || undefined,
        lensWidth: form.lensWidth ? parseInt(form.lensWidth) : undefined,
        bridgeWidth: form.bridgeWidth ? parseInt(form.bridgeWidth) : undefined,
        templeLength: form.templeLength ? parseInt(form.templeLength) : undefined,
        frameWidth: form.frameWidth ? parseInt(form.frameWidth) : undefined,
        status: form.status,
        isNew: form.isNew,
        isBestseller: form.isBestseller,
        isFeatured: form.isFeatured,
        // variants is sent on BOTH create and edit — the backend replaces the
        // product's single "Default" variant's images/video with this set.
        // Editing used to silently discard newly uploaded photos entirely
        // (they reached R2 but were never attached to the product) and there
        // was no way to attach a video at all.
        variants: [
          {
            color: 'Default',
            stock: form.stock,
            videoUrl,
            images: allImages,
          },
        ],
      };

      if (form.id) {
        await api.patch(`/admin/products/${form.id}`, basePayload);
      } else {
        await api.post('/admin/products', basePayload);
      }

      closeDialog();
      load();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Error: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    } finally {
      setLoading(false);
    }
  };

  const action = async (id: string, path: string) => {
    await api.post(`/admin/products/${id}/${path}`).catch(() => setError(`Action "${path}" failed.`));
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Move this product to the recycle bin?')) return;
    await api.delete(`/admin/products/${id}`).catch(() => setError('Delete failed.'));
    load();
  };

  const handleEdit = (p: Product) => {
    const defaultVariant = p.variants?.[0];
    setForm({
      id: p.id,
      name: p.name,
      brandId: p.brand?.id || '',
      categoryId: p.category?.id || '',
      gender: p.gender || 'unisex',
      price: p.price,
      originalPrice: p.originalPrice?.toString() || '',
      stock: p.stock,
      description: p.description || '',
      material: (p as any).material || '',
      frameShape: (p as any).frameShape || '',
      weight: (p as any).weight?.toString() || '',
      warranty: (p as any).warranty || '',
      lensWidth: (p as any).lensWidth?.toString() || '',
      bridgeWidth: (p as any).bridgeWidth?.toString() || '',
      templeLength: (p as any).templeLength?.toString() || '',
      frameWidth: (p as any).frameWidth?.toString() || '',
      status: p.status || 'PUBLISHED',
      isNew: p.isNew ?? false,
      isBestseller: p.isBestseller ?? false,
      isFeatured: p.isFeatured ?? false,
    });
    setExistingImages(defaultVariant?.images?.map((img) => ({ id: img.id, url: img.url, isPrimary: img.isPrimary })) || []);
    setExistingVideoUrl(defaultVariant?.videoUrl || '');
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Products</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium"
        >
          <RiAddLine /> New Product
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search by name..."
        className="w-full max-w-sm mb-4 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-700">
                  <div className="flex items-center gap-1.5">
                    {p.name}
                    {p.isFeatured && <RiStarLine className="text-amber-400" size={14} title="Featured" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{p.brand?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  ₹{p.price}
                  {p.stock <= 0 && <span className="ml-1.5 text-[10px] font-semibold text-red-500 uppercase">Out of stock</span>}
                </td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3"><Badge value={p.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    {p.status !== 'PUBLISHED' ? (
                      <button title="Publish" onClick={() => action(p.id, 'publish')}><RiCheckLine /></button>
                    ) : (
                      <button title="Unpublish" onClick={() => action(p.id, 'unpublish')}><RiUnpublishLine /></button>
                    )}
                    <button title="Edit" onClick={() => handleEdit(p)}><RiEdit2Line /></button>
                    <button title="Duplicate" onClick={() => action(p.id, 'duplicate')}><RiFileCopyLine /></button>
                    <button title="Archive" onClick={() => action(p.id, 'archive')}><RiArchiveLine /></button>
                    <button title="Delete" onClick={() => remove(p.id)}><RiDeleteBinLine className="text-red-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.items.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No products found.</p>}
      </div>

      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}

      <Modal open={modalOpen} onClose={closeDialog} title={form.id ? "Edit Product" : "New Product"}>
        <div className="space-y-3">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono uppercase text-slate-500">Brand</label>
              <button type="button" onClick={() => setQuickAddBrand({ ...quickAddBrand, open: !quickAddBrand.open })} className="text-xs text-accent font-medium hover:underline">
                + New brand
              </button>
            </div>
            {quickAddBrand.open && (
              <div className="flex gap-2 mb-2">
                <input
                  autoFocus
                  value={quickAddBrand.name}
                  onChange={(e) => setQuickAddBrand({ ...quickAddBrand, name: e.target.value })}
                  placeholder="Brand name"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-accent"
                />
                <button type="button" onClick={createBrandInline} disabled={quickAddBrand.saving} className="rounded-lg bg-primary text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50">
                  {quickAddBrand.saving ? '...' : 'Add'}
                </button>
              </div>
            )}
            <select
              value={form.brandId}
              onChange={(e) => setForm({ ...form, brandId: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">Select a brand...</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {brandsLoaded && brands.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No brands yet — use "+ New brand" above to create one.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">No category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No categories yet — add one from the Categories page so this product can show up in "shop by category".</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="unisex">Unisex</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price" type="number" value={String(form.price)} onChange={(v) => setForm({ ...form, price: Number(v) })} />
            <Field label="Original / MRP (optional)" type="number" value={form.originalPrice} onChange={(v) => setForm({ ...form, originalPrice: v })} />
          </div>
          <Field label="Stock" type="number" value={String(form.stock)} onChange={(v) => setForm({ ...form, stock: Number(v) })} />

          <div className="flex items-center gap-4 py-1">
            <Checkbox label="New Arrival" checked={form.isNew} onChange={(v) => setForm({ ...form, isNew: v })} />
            <Checkbox label="Bestseller" checked={form.isBestseller} onChange={(v) => setForm({ ...form, isBestseller: v })} />
            <Checkbox label="Featured" checked={form.isFeatured} onChange={(v) => setForm({ ...form, isFeatured: v })} />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Material" value={form.material} onChange={(v) => setForm({ ...form, material: v })} />
            <Field label="Frame Shape" value={form.frameShape} onChange={(v) => setForm({ ...form, frameShape: v })} />
            <Field label="Weight (g)" type="number" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} />
            <Field label="Warranty" value={form.warranty} onChange={(v) => setForm({ ...form, warranty: v })} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Lens Width" type="number" value={form.lensWidth} onChange={(v) => setForm({ ...form, lensWidth: v })} />
            <Field label="Bridge Width" type="number" value={form.bridgeWidth} onChange={(v) => setForm({ ...form, bridgeWidth: v })} />
            <Field label="Temple Length" type="number" value={form.templeLength} onChange={(v) => setForm({ ...form, templeLength: v })} />
            <Field label="Frame Width" type="number" value={form.frameWidth} onChange={(v) => setForm({ ...form, frameWidth: v })} />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Photos (all saved to Cloudflare R2)</label>

            {existingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {existingImages.map((img, i) => (
                  <div key={img.id ?? img.url} className="relative">
                    <img src={img.url} className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                    {i === 0 && <span className="absolute -top-1.5 -left-1.5 bg-primary text-white text-[9px] px-1 rounded">MAIN</span>}
                    <button
                      type="button"
                      onClick={() => setExistingImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 bg-white rounded-full shadow"
                    >
                      <RiCloseCircleLine className="text-red-500" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {newImageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {newImageFiles.map((file, i) => (
                  <div key={i} className="relative">
                    <img src={URL.createObjectURL(file)} className="h-16 w-16 rounded-lg object-cover border border-dashed border-accent" />
                    <button
                      type="button"
                      onClick={() => setNewImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 bg-white rounded-full shadow"
                    >
                      <RiCloseCircleLine className="text-red-500" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-slate-50 transition-colors text-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <RiUploadCloud2Line className="text-2xl text-slate-400 mb-1" />
                <p className="text-xs font-medium text-slate-600">Upload Photos</p>
                <p className="text-[10px] text-slate-400">Multiple at once</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-slate-50 transition-colors text-center"
                onClick={startCamera}
              >
                <RiUploadCloud2Line className="text-2xl text-slate-400 mb-1" />
                <p className="text-xs font-medium text-slate-600">Live Capture</p>
              </div>
            </div>

            {cameraError && <p className="text-xs text-red-600 mt-2">{cameraError}</p>}

            {cameraOpen && (
              <div className="mt-3 relative rounded-xl overflow-hidden bg-black flex flex-col items-center">
                <video ref={videoRef} className="w-full max-h-48 object-cover" autoPlay playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-2 flex gap-2">
                  <button onClick={capturePhoto} className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold">Capture</button>
                  <button onClick={stopCamera} className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold">Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Video (optional, also saved to R2)</label>
            {existingVideoUrl && !newVideoFile && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 mb-2 text-sm">
                <span className="flex items-center gap-1.5 text-slate-600"><RiVideoLine /> Video attached</span>
                <button type="button" onClick={() => setExistingVideoUrl('')} className="text-red-500 text-xs font-medium">Remove</button>
              </div>
            )}
            {newVideoFile && (
              <div className="flex items-center justify-between rounded-lg border border-dashed border-accent px-3 py-2 mb-2 text-sm">
                <span className="flex items-center gap-1.5 text-slate-600"><RiVideoLine /> {newVideoFile.name}</span>
                <button type="button" onClick={() => setNewVideoFile(null)} className="text-red-500 text-xs font-medium">Remove</button>
              </div>
            )}
            {!existingVideoUrl && !newVideoFile && (
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:border-accent hover:bg-slate-50 transition-colors text-center"
                onClick={() => videoInputRef.current?.click()}
              >
                <RiVideoLine className="text-xl text-slate-400" />
                <p className="text-xs font-medium text-slate-600">Upload a product video</p>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setNewVideoFile(e.target.files[0])}
                />
              </div>
            )}
          </div>

          <button
            onClick={saveProduct}
            disabled={loading || !form.name}
            className="w-full rounded-lg bg-primary text-white py-2.5 text-sm font-medium disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Saving...
              </>
            ) : form.id ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase text-slate-500 mb-1">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-accent" />
      {label}
    </label>
  );
}
