import { useEffect, useRef, useState } from 'react';
import { RiAddLine, RiDeleteBinLine, RiFolderAddLine, RiLoader4Line, RiPlayCircleLine, RiUploadCloud2Line } from 'react-icons/ri';
import { api, type PaginatedData } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';

// This page didn't exist at all before — the backend already had a complete
// admin Gallery API (albums + items, image or video), but there was no admin
// UI for it whatsoever, so photos/videos could never actually be added to
// the storefront's Gallery page.

interface Album { id: string; title: string; category: string }
interface GalleryItem { id: string; url: string; type: string; category: string; albumId?: string; altText?: string }

export default function GalleryPage() {
  const [data, setData] = useState<PaginatedData<GalleryItem> | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('store');
  const [albumId, setAlbumId] = useState('');
  const [albumForm, setAlbumForm] = useState({ title: '', category: 'store' });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    api.get('/admin/gallery', { params: { page, limit: 24 } })
      .then((res) => setData(res.data.data))
      .catch(() => setError('Could not load gallery items.'));
  };
  const loadAlbums = () => {
    api.get('/gallery/albums').then((res) => setAlbums(res.data.data ?? [])).catch(() => {});
  };

  useEffect(load, [page]);
  useEffect(loadAlbums, []);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    if (!isVideo && !file.type.startsWith('image/')) {
      setError('Only images or videos are supported.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'gallery');
      const { data: uploadRes } = await api.post('/upload/admin', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.post('/admin/gallery', {
        url: uploadRes.data.url,
        type: isVideo ? 'video' : 'image',
        category,
        albumId: albumId || undefined,
      });
      setItemModalOpen(false);
      load();
    } catch {
      setError('Upload failed — please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const createAlbum = async () => {
    if (!albumForm.title.trim()) return;
    try {
      await api.post('/admin/gallery/albums', albumForm);
      setAlbumModalOpen(false);
      setAlbumForm({ title: '', category: 'store' });
      loadAlbums();
    } catch {
      setError('Could not create album.');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this gallery item?')) return;
    await api.delete(`/admin/gallery/${id}`).catch(() => setError('Delete failed.'));
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Gallery</h1>
        <div className="flex gap-2">
          <button onClick={() => setAlbumModalOpen(true)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">
            <RiFolderAddLine /> New Album
          </button>
          <button onClick={() => setItemModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium">
            <RiAddLine /> Upload Photo/Video
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {data?.items.map((item) => (
          <div key={item.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square">
            {item.type === 'video' ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white">
                <RiPlayCircleLine size={28} />
              </div>
            ) : (
              <img src={item.url} alt={item.altText ?? ''} className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => remove(item.id)}
              className="absolute top-1 right-1 bg-white/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete"
            >
              <RiDeleteBinLine size={14} className="text-red-500" />
            </button>
            <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">{item.category}</span>
          </div>
        ))}
        {data?.items.length === 0 && <p className="col-span-full text-center text-sm text-slate-400 py-8">Nothing here yet.</p>}
      </div>

      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}

      <Modal open={itemModalOpen} onClose={() => setItemModalOpen(false)} title="Upload Photo or Video">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="e.g. store, events, before-after" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Album (optional)</label>
            <select value={albumId} onChange={(e) => setAlbumId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">No album</option>
              {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 cursor-pointer hover:border-accent">
            {uploading ? <RiLoader4Line className="animate-spin text-primary" size={28} /> : <RiUploadCloud2Line size={28} className="text-slate-400" />}
            <span className="text-sm text-slate-500">{uploading ? 'Uploading…' : 'Click to choose an image or video'}</span>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
        </div>
      </Modal>

      <Modal open={albumModalOpen} onClose={() => setAlbumModalOpen(false)} title="New Album">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Title</label>
            <input value={albumForm.title} onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Category</label>
            <input value={albumForm.category} onChange={(e) => setAlbumForm({ ...albumForm, category: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <button onClick={createAlbum} className="w-full rounded-lg bg-primary text-white py-2.5 text-sm font-medium">Create Album</button>
        </div>
      </Modal>
    </div>
  );
}
