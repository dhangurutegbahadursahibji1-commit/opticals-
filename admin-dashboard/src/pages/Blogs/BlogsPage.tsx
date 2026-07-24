import SimpleCrudPage from '../../components/ui/SimpleCrudPage';
import Badge from '../../components/ui/Badge';

interface Blog { id: string; title: string; category?: string; status: string; featuredImage?: string }

export default function BlogsPage() {
  return (
    <SimpleCrudPage<Blog>
      title="Blogs"
      adminBasePath="/admin/blogs"
      columns={[
        { key: 'featuredImage', label: 'Cover', render: (b) => b.featuredImage ? <img src={b.featuredImage} alt={b.title} className="h-8 w-12 rounded object-cover border border-slate-200" /> : <span className="text-slate-300">—</span> },
        { key: 'title', label: 'Title' },
        { key: 'category', label: 'Category' },
        { key: 'status', label: 'Status', render: (b) => <Badge value={b.status} /> },
      ]}
      formFields={[
        { key: 'featuredImage', label: 'Cover Image', type: 'image', folder: 'blogs' },
        { key: 'title', label: 'Title' },
        { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
        { key: 'content', label: 'Content (Markdown)', type: 'textarea' },
        { key: 'category', label: 'Category' },
        {
          key: 'status', label: 'Status', type: 'select',
          options: [
            { value: 'DRAFT', label: 'Draft' },
            { value: 'PUBLISHED', label: 'Published' },
            { value: 'SCHEDULED', label: 'Scheduled' },
          ],
        },
      ]}
      emptyForm={{ featuredImage: '', title: '', excerpt: '', content: '', category: '', status: 'DRAFT' }}
    />
  );
}
