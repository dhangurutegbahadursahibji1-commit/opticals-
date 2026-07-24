import SimpleCrudPage from '../../components/ui/SimpleCrudPage';

interface Brand { id: string; name: string; country?: string; displayOrder: number; logoUrl?: string }

export default function BrandsPage() {
  return (
    <SimpleCrudPage<Brand>
      title="Brands"
      adminBasePath="/admin/brands"
      columns={[
        { key: 'logoUrl', label: 'Logo', render: (b) => b.logoUrl ? <img src={b.logoUrl} alt={b.name} className="h-8 w-8 rounded object-contain border border-slate-200" /> : <span className="text-slate-300">—</span> },
        { key: 'name', label: 'Name' },
        { key: 'country', label: 'Country' },
        { key: 'displayOrder', label: 'Order' },
      ]}
      formFields={[
        { key: 'logoUrl', label: 'Logo', type: 'image', folder: 'brands' },
        { key: 'name', label: 'Name' },
        { key: 'country', label: 'Country' },
        { key: 'website', label: 'Website', type: 'url' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'displayOrder', label: 'Display Order', type: 'number' },
      ]}
      emptyForm={{ logoUrl: '', name: '', country: '', website: '', description: '', displayOrder: 0 }}
    />
  );
}
