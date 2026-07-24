import SimpleCrudPage from '../../components/ui/SimpleCrudPage';
import Badge from '../../components/ui/Badge';

interface Offer { id: string; title: string; discountValue: number; couponCode?: string; status: string; validUntil: string; bannerUrl?: string }

export default function OffersPage() {
  return (
    <SimpleCrudPage<Offer>
      title="Offers"
      adminBasePath="/admin/offers"
      columns={[
        { key: 'bannerUrl', label: 'Banner', render: (o) => o.bannerUrl ? <img src={o.bannerUrl} alt={o.title} className="h-8 w-12 rounded object-cover border border-slate-200" /> : <span className="text-slate-300">—</span> },
        { key: 'title', label: 'Title' },
        { key: 'discountValue', label: 'Discount' },
        { key: 'couponCode', label: 'Code' },
        { key: 'status', label: 'Status', render: (o) => <Badge value={o.status} /> },
        { key: 'validUntil', label: 'Valid Until', render: (o) => new Date(o.validUntil).toLocaleDateString() },
      ]}
      formFields={[
        { key: 'bannerUrl', label: 'Banner Image', type: 'image', folder: 'offers' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description', type: 'textarea' },
        {
          key: 'discountType', label: 'Discount Type', type: 'select',
          options: [
            { value: 'percentage', label: 'Percentage (%)' },
            { value: 'flat', label: 'Flat amount (₹)' },
          ],
        },
        { key: 'discountValue', label: 'Discount Value', type: 'number' },
        { key: 'couponCode', label: 'Coupon Code' },
        { key: 'validFrom', label: 'Valid From', type: 'date' },
        { key: 'validUntil', label: 'Valid Until', type: 'date' },
      ]}
      emptyForm={{ bannerUrl: '', title: '', description: '', discountType: 'percentage', discountValue: 10, couponCode: '', validFrom: new Date().toISOString(), validUntil: new Date(Date.now() + 30 * 86400000).toISOString() }}
    />
  );
}
