import { useState } from 'react';
import { useConfigurator } from '../../../context/ConfiguratorContext';
import { motion, AnimatePresence } from 'framer-motion';
import { RiGlassesLine, RiSunLine, RiComputerLine, RiCloseCircleLine, RiInformationLine, RiMagicLine } from 'react-icons/ri';
import type { LensType } from '../../../types';

export default function StepLensType() {
  const { config, setLensType, product, setExpertAssistance, goToStep, catalogue } = useConfigurator();
  const [infoModal, setInfoModal] = useState<any | null>(null);

  // Map backend lens types to icons
  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('photochromic') || lower.includes('transition')) return RiSunLine;
    if (lower.includes('computer') || lower.includes('blue')) return RiComputerLine;
    if (lower.includes('frame')) return RiCloseCircleLine;
    return RiGlassesLine;
  };

  // Basic availability logic (checks product.lensSupport)
  const isSupported = (id: string) => {
    if (!product.lensSupport) return true;
    switch (id) {
      case 'single-vision': return product.lensSupport.singleVision !== false;
      case 'progressive': return product.lensSupport.progressive !== false;
      case 'photochromic': return product.lensSupport.photochromic !== false;
      default: return true;
    }
  };

  const handleSelect = (id: string) => {
    setExpertAssistance(false);
    setLensType(id as LensType);
  };

  const handleExpertRecommendation = () => {
    setExpertAssistance(true);
    setLensType(null); // Default fallback, expert will change it
    goToStep(4); // Skip to review
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl font-semibold text-primary">Choose Your Lens Type</h2>
        <p className="text-muted mt-2">Select the perfect lenses for your lifestyle.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {catalogue?.lenses?.map((lens: any) => {
          const active = config.lensTypeId === lens.id && !config.expertAssistance;
          const disabled = !isSupported(lens.name.toLowerCase().replace(' ', '-')); // Rough fallback for old support check
          const Icon = getIcon(lens.name);
          const price = Number(lens.salePrice || lens.basePrice) || 0;
          
          return (
            <div key={lens.id} className="relative">
              <button
                onClick={() => !disabled && handleSelect(lens.id)}
                disabled={disabled}
                className={`w-full flex items-center p-6 text-left rounded-2xl border-2 transition-all duration-300 overflow-hidden
                  ${disabled ? 'opacity-50 cursor-not-allowed border-primary/5 bg-primary/5' : 
                    active ? 'border-accent bg-accent/5 ring-4 ring-accent/10 shadow-lg' : 'border-primary/10 hover:border-accent/50 hover:bg-surface'
                  }
                `}
              >
                <div className={`p-4 rounded-full mr-5 shrink-0 ${active ? 'bg-accent text-white' : 'bg-primary/5 text-primary'}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-display text-lg font-semibold truncate ${active ? 'text-accent' : 'text-primary'}`}>{lens.name}</h3>
                    <span className={`text-sm font-semibold whitespace-nowrap ml-2 ${active ? 'text-accent' : 'text-primary'}`}>
                      {price === 0 ? 'Free' : `+₹${price}`}
                    </span>
                  </div>
                  <p className="text-sm text-muted mt-1 truncate">{lens.description || 'Premium quality lens'}</p>
                  {disabled && <p className="text-xs text-red-500 mt-2 font-medium">Not compatible with this frame.</p>}
                </div>
                
                {active && (
                  <motion.div
                    layoutId="lens-active-border"
                    className="absolute inset-0 border-2 border-accent rounded-2xl pointer-events-none"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
              
              {!disabled && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setInfoModal(lens); }}
                  className="absolute right-4 bottom-4 p-2 text-primary/40 hover:text-accent transition-colors rounded-full hover:bg-accent/10"
                  title="Learn More"
                >
                  <RiInformationLine size={20} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-primary/10"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-surface px-4 text-sm text-muted font-medium uppercase tracking-widest">Or</span>
          </div>
        </div>

        <button
          onClick={handleExpertRecommendation}
          className={`w-full mt-8 p-6 flex items-center justify-center rounded-2xl border-2 transition-all duration-300
            ${config.expertAssistance 
              ? 'border-accent bg-accent/5 ring-4 ring-accent/10 shadow-lg' 
              : 'border-dashed border-primary/20 hover:border-accent hover:bg-accent/5'}`}
        >
          <div className={`p-3 rounded-full mr-4 ${config.expertAssistance ? 'bg-accent text-white' : 'bg-primary/5 text-primary'}`}>
            <RiMagicLine size={24} />
          </div>
          <div className="text-left">
            <h3 className={`font-display text-lg font-semibold ${config.expertAssistance ? 'text-accent' : 'text-primary'}`}>
              Expert Recommendation
            </h3>
            <p className="text-sm text-muted mt-1">Not sure? We'll review your prescription and recommend the best lens.</p>
          </div>
        </button>
      </div>

      {/* Learn More Modal */}
      <AnimatePresence>
        {infoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setInfoModal(null)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface w-full max-w-md rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="p-8">
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-6">
                  {(() => {
                    const ModalIcon = getIcon(infoModal.name);
                    return <ModalIcon size={28} />;
                  })()}
                </div>
                <h3 className="font-display text-2xl font-bold text-primary mb-2">{infoModal.name}</h3>
                <p className="text-muted leading-relaxed mb-8">{infoModal.description || 'A premium quality lens tailored for your visual needs.'}</p>
                <button 
                  onClick={() => setInfoModal(null)}
                  className="w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
