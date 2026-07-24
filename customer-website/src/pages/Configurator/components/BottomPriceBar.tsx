import { useNavigate } from 'react-router-dom';
import { useConfigurator } from '../../../context/ConfiguratorContext';
import { useCart } from '../../../context/CartContext';
import { motion } from 'framer-motion';
import { RiArrowLeftLine, RiArrowRightLine, RiShoppingBag3Line } from 'react-icons/ri';

export default function BottomPriceBar() {
  const { config, product, currentStep, nextStep, previousStep, validateStep, priceBreakdown } = useConfigurator();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const handleAddToCart = () => {
    addToCart(product, product.variants.find(v => v.id === config.variantId) || product.variants[0], 1, {
      lensConfig: config,
      priceBreakdown
    });
    navigate('/cart');
  };

  const isNextEnabled = validateStep(currentStep);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-primary/10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
        <button
          onClick={previousStep}
          disabled={currentStep === 1}
          className={`flex items-center gap-2 font-medium ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-primary hover:text-accent'}`}
        >
          <RiArrowLeftLine /> Back
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs text-muted uppercase tracking-wider font-semibold">Total Price</span>
          <motion.div
            key={priceBreakdown.subtotal}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-display font-semibold text-primary"
          >
            ₹{priceBreakdown.subtotal.toLocaleString()}
          </motion.div>
        </div>

        {currentStep < 4 ? (
          <button
            onClick={nextStep}
            disabled={!isNextEnabled}
            className="flex items-center gap-2 font-medium bg-primary text-white px-6 py-3 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next <RiArrowRightLine />
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-2 font-medium bg-accent text-white px-6 py-3 rounded-full hover:bg-accent/90 transition-all shadow-lg hover:shadow-accent/30"
          >
            <RiShoppingBag3Line /> Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
