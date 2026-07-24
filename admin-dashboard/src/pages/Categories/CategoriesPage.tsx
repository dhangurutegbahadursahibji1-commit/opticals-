import SimpleCrudPage from '../../components/ui/SimpleCrudPage';

interface Category { id: string; name: string; displayOrder: number; imageUrl?: string }

export default function CategoriesPage() {
  return (
    <SimpleCrudPage<Category>
      title="Categories"
      adminBasePath="/admin/categories"
      columns={[
        { key: 'imageUrl', label: 'Image', render: (c) => c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="h-8 w-8 rounded object-cover border border-slate-200" /> : <span className="text-slate-300">—</span> },
        { key: 'name', label: 'Name' },
        { key: 'displayOrder', label: 'Order' },
      ]}
      formFields={[
        { key: 'imageUrl', label: 'Category Image', type: 'image', folder: 'categories' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'displayOrder', label: 'Display Order', type: 'number' },
      ]}
      emptyForm={{ imageUrl: '', name: '', description: '', displayOrder: 0 }}
    />
  );
}
