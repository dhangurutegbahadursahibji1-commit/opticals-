import { useConfigurator } from '../../../context/ConfiguratorContext';
import { motion } from 'framer-motion';
import { RiSunLine, RiComputerLine, RiSparklingLine } from 'react-icons/ri';

export default function StepCoating() {
  const { config, toggleCoating, catalogue } = useConfigurator();

  // Map backend add-on types to icons
  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('photochromic') || lower.includes('transition')) return RiSunLine;
    if (lower.includes('blue')) return RiComputerLine;
    return RiSparklingLine;
  };

  // If base lens is already blue-cut or photochromic, we disable those coatings
  const isIncluded = (id: string) => {
    if (id === 'blue-cut' && config.lensTypeId === 'blue-cut') return true;
    if (id === 'photochromic' && config.lensTypeId === 'photochromic') return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl font-semibold text-primary">Enhance Your Lenses</h2>
        <p className="text-muted mt-2">Add premium coatings for better protection and clarity.</p>
      </div>

      <div className="grid gap-4">
        {catalogue?.addOns?.map((opt: any) => {
          const included = isIncluded(opt.name.toLowerCase().replace(' ', '-'));
          const active = config.coatingIds.includes(opt.id) || included;
          const Icon = getIcon(opt.name);
          const price = Number(opt.salePrice || opt.basePrice) || 0;

          return (
            <button
              key={opt.id}
              onClick={() => !included && toggleCoating(opt.id)}
              disabled={included}
              className={`relative flex items-center p-6 text-left rounded-2xl border-2 transition-all duration-300 overflow-hidden
                ${included ? 'border-accent bg-accent/5' :
                  active ? 'border-accent bg-accent/5 ring-4 ring-accent/10 shadow-lg' : 'border-primary/10 hover:border-accent/50 hover:bg-surface'
                }
              `}
            >
              <div className={`p-4 rounded-full mr-5 ${active ? 'bg-accent text-white' : 'bg-primary/5 text-primary'}`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-display text-lg font-semibold ${active ? 'text-accent' : 'text-primary'}`}>{opt.name}</h3>
                  <span className={`text-sm font-semibold ${active ? 'text-accent' : 'text-primary'}`}>
                    {included ? 'Included' : `+₹${price}`}
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">{opt.description || 'Premium lens coating'}</p>
                {included && <p className="text-xs text-accent mt-2 font-medium">Included with your selected lens type.</p>}
              </div>
              
              {active && !included && (
                <motion.div
                  layoutId={`coating-active-${opt.id}`}
                  className="absolute inset-0 border-2 border-accent rounded-2xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  );
}
