import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfiguratorProvider, useConfigurator } from '../../context/ConfiguratorContext';
import { fetchProductBySlug, fetchOpticalCatalogue } from '../../services/api';

import Stepper from './components/Stepper';
import BottomPriceBar from './components/BottomPriceBar';
import StepLensType from './components/StepLensType';
import StepPrescription from './components/StepPrescription';
import StepCoating from './components/StepCoating';
import StepReview from './components/StepReview';

// Inner component that actually uses the context to render steps
function ConfiguratorContent() {
  const { currentStep } = useConfigurator();

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-24">
      <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-primary/10">
        <Stepper />
      </div>
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && <StepLensType />}
            {currentStep === 2 && <StepPrescription />}
            {currentStep === 3 && <StepCoating />}
            {currentStep === 4 && <StepReview />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomPriceBar />
    </div>
  );
}

// Wrapper that fetches product and provides context
export default function ConfiguratorLayout() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  // Using any here temporarily because ApiProduct differs slightly from Product frontend type
  const [product, setProduct] = useState<any | null>(null);
  const [catalogue, setCatalogue] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    
    const fetchProduct = async () => {
      try {
        const [found, catData] = await Promise.all([
          fetchProductBySlug(productId),
          fetchOpticalCatalogue()
        ]);
        
        if (found) {
          // Adapt backend ApiProduct to frontend Product expected by Configurator
          const defaultVariant = found.variants?.[0];
          setProduct({
            ...found,
            defaultVariantId: defaultVariant?.id,
            price: Number(found.price),
            originalPrice: found.originalPrice ? Number(found.originalPrice) : undefined,
          });
          setCatalogue(catData);
        } else {
          navigate('/404', { replace: true });
        }
      } catch (err) {
        console.error('Error fetching product for configurator', err);
        navigate('/404', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface text-primary">Loading configuration...</div>;
  }

  if (!product || !catalogue) return null;

  return (
    <ConfiguratorProvider product={product} variantId={product.defaultVariantId} catalogue={catalogue}>
      <ConfiguratorContent />
    </ConfiguratorProvider>
  );
}
