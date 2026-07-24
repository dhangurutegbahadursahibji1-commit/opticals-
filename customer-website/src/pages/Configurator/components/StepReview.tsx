import { useConfigurator } from '../../../context/ConfiguratorContext';
import { RiCheckLine } from 'react-icons/ri';

export default function StepReview() {
  const { config, product, goToStep, setCustomerNotes, priceBreakdown, catalogue } = useConfigurator();

  const getLensName = () => {
    if (config.lensTypeId === 'frame-only') return 'Frame Only';
    const lens = catalogue?.lenses?.find((l: any) => l.id === config.lensTypeId);
    return lens ? lens.name : config.lensTypeId;
  };

  const getCoatingNames = () => {
    return config.coatingIds.map(id => {
      const addon = catalogue?.addOns?.find((a: any) => a.id === id);
      return addon ? addon.name : id;
    }).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl font-semibold text-primary">Review Configuration</h2>
        <p className="text-muted mt-2">Check your selections before adding to cart.</p>
      </div>

      <div className="bg-surface rounded-3xl border border-primary/10 p-8 shadow-xl max-w-2xl mx-auto">
        <div className="flex items-center gap-6 pb-6 border-b border-primary/10 mb-6">
          <img 
            src={product.variants.find(v => v.id === config.variantId)?.images?.[0]?.url || product.variants[0]?.images?.[0]?.url || 'https://via.placeholder.com/300?text=No+Image'} 
            alt={product.name} 
            className="w-32 h-20 object-cover rounded-xl bg-primary/5"
          />
          <div>
            <h3 className="font-display text-xl font-semibold text-primary">{product.name}</h3>
            <p className="text-muted">
              {typeof product.brand === 'object'
                ? (product.brand as any)?.name
                : product.brand ?? ''}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent"><RiCheckLine /></div>
              <div>
                <p className="font-semibold text-primary">Frame</p>
                <button onClick={() => window.history.back()} className="text-xs text-accent hover:underline">Change frame</button>
              </div>
            </div>
            <span className="font-semibold text-primary">₹{priceBreakdown.frame.toLocaleString()}</span>
          </div>

          {config.expertAssistance ? (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent"><RiCheckLine /></div>
                <div>
                  <p className="font-semibold text-primary">Lens: Expert Recommendation</p>
                  <button onClick={() => goToStep(1)} className="text-xs text-accent hover:underline">Change</button>
                </div>
              </div>
              <span className="font-semibold text-primary">TBD</span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent"><RiCheckLine /></div>
                <div>
                  <p className="font-semibold text-primary">Lens: {getLensName()}</p>
                  <button onClick={() => goToStep(1)} className="text-xs text-accent hover:underline">Edit lens</button>
                </div>
              </div>
              <span className="font-semibold text-primary">₹{priceBreakdown.lens.toLocaleString()}</span>
            </div>
          )}

          {config.lensTypeId !== 'frame-only' && !config.expertAssistance && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent"><RiCheckLine /></div>
                <div>
                  <p className="font-semibold text-primary">Prescription: {config.prescription?.status === 'uploaded' ? 'File Uploaded' : 'Provide Later'}</p>
                  <button onClick={() => goToStep(2)} className="text-xs text-accent hover:underline">Edit prescription</button>
                </div>
              </div>
              <span className="font-semibold text-primary">—</span>
            </div>
          )}

          {config.coatingIds.length > 0 && !config.expertAssistance && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent"><RiCheckLine /></div>
                <div>
                  <p className="font-semibold text-primary">Coatings: {getCoatingNames()}</p>
                  <button onClick={() => goToStep(3)} className="text-xs text-accent hover:underline">Edit coatings</button>
                </div>
              </div>
              <span className="font-semibold text-primary">₹{priceBreakdown.coating.toLocaleString()}</span>
            </div>
          )}

          {priceBreakdown.discount > 0 && (
            <div className="flex justify-between items-center pt-4 border-t border-primary/10">
              <span className="font-semibold text-accent">Discount</span>
              <span className="font-semibold text-accent">-₹{priceBreakdown.discount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-primary/10">
            <span className="font-display font-semibold text-xl text-primary">Estimated Total</span>
            <span className="font-display font-semibold text-2xl text-primary">₹{priceBreakdown.subtotal.toLocaleString()}</span>
          </div>
          {config.expertAssistance && (
            <p className="text-xs text-muted text-right">Final price may vary based on expert lens recommendation.</p>
          )}

          <div className="pt-6 mt-6 border-t border-primary/10">
            <label className="block text-sm font-semibold text-primary mb-2">Additional Notes for Optometrist (Optional)</label>
            <textarea
              className="w-full bg-surface border-2 border-primary/10 rounded-xl p-4 text-primary focus:border-accent outline-none resize-none transition-colors"
              rows={3}
              placeholder="E.g., I spend 10 hours a day on my computer, or I need my glasses to be extremely lightweight..."
              value={config.customerNotes || ''}
              onChange={(e) => setCustomerNotes(e.target.value)}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
