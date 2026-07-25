import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { calculatePricing } from '../services/api';
import type { LensConfiguration, Product, LensType, PriceBreakdown } from '../types';

interface ConfiguratorState {
  version: number;
  data: LensConfiguration;
}

const STORAGE_KEY = 'ao_configurator_v1';
const CURRENT_VERSION = 1;

interface ConfiguratorContextValue {
  config: LensConfiguration;
  product: Product;
  catalogue: any;
  priceBreakdown: PriceBreakdown;
  currentStep: number;

  // Actions
  setLensType: (lensTypeId: LensType | null) => void;
  toggleCoating: (coatingId: string) => void;
  setPrescriptionStatus: (status: NonNullable<LensConfiguration['prescription']>['status'], fileMeta?: { name: string; size: number; type: string }, manualData?: any, uploadedUrl?: string) => void;
  setExpertAssistance: (expertAssistance: boolean) => void;
  setCustomerNotes: (notes: string) => void;
  
  // Navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  
  // Validation
  validateStep: (stepIndex: number) => boolean;
  isComplete: () => boolean;
  
  // Reset
  reset: () => void;
}

const ConfiguratorContext = createContext<ConfiguratorContextValue | undefined>(undefined);

const getDefaultConfig = (productId: string, variantId: string): LensConfiguration => ({
  productId,
  variantId,
  lensTypeId: null,
  coatingIds: [],
});

export function ConfiguratorProvider({ 
  product, 
  variantId,
  catalogue, 
  children 
}: { 
  product: Product; 
  variantId: string; 
  catalogue: any;
  children: ReactNode 
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine current step from URL
  const currentStep = parseInt(searchParams.get('step') || '1', 10);

  // Initialize state from sessionStorage or default
  const [config, setConfig] = useState<LensConfiguration>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ConfiguratorState;
        // Check version and ensure it matches current product
        if (parsed.version === CURRENT_VERSION && parsed.data.productId === product.id) {
          return parsed.data;
        }
      }
    } catch (e) {
      console.error('Failed to parse configurator session', e);
    }
    return getDefaultConfig(product.id, variantId);
  });

  // Persist state changes to sessionStorage
  useEffect(() => {
    const state: ConfiguratorState = {
      version: CURRENT_VERSION,
      data: config,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [config]);

  // Sync URL query params with state (e.g. ?lens=single-vision)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let changed = false;
    
    if (config.lensTypeId && params.get('lens') !== config.lensTypeId) {
      params.set('lens', config.lensTypeId);
      changed = true;
    } else if (!config.lensTypeId && params.has('lens')) {
      params.delete('lens');
      changed = true;
    }

    if (changed) {
      setSearchParams(params, { replace: true });
    }
  }, [config.lensTypeId, searchParams, setSearchParams]);

  // Actions
  const setLensType = useCallback((lensTypeId: LensType | null) => {
    setConfig(prev => ({ ...prev, lensTypeId }));
  }, []);

  const toggleCoating = useCallback((coatingId: string) => {
    setConfig(prev => {
      const exists = prev.coatingIds.includes(coatingId);
      return {
        ...prev,
        coatingIds: exists 
          ? prev.coatingIds.filter(id => id !== coatingId)
          : [...prev.coatingIds, coatingId]
      };
    });
  }, []);

  const setPrescriptionStatus = useCallback((
    status: NonNullable<LensConfiguration['prescription']>['status'], 
    fileMeta?: { name: string; size: number; type: string },
    manualData?: any, // using any here for quick fix, it maps to ManualPrescription
    uploadedUrl?: string
  ) => {
    setConfig(prev => ({
      ...prev,
      prescription: { status, fileMeta, manualData },
      // Only overwrite prescriptionId when we actually have a new URL — keeps
      // an earlier successful upload intact if this gets called again for an
      // unrelated status change.
      ...(uploadedUrl ? { prescriptionId: uploadedUrl } : {}),
    }));
  }, []);

  const setExpertAssistance = useCallback((expertAssistance: boolean) => {
    setConfig(prev => ({ ...prev, expertAssistance }));
  }, []);

  const setCustomerNotes = useCallback((customerNotes: string) => {
    setConfig(prev => ({ ...prev, customerNotes }));
  }, []);

  const reset = useCallback(() => {
    setConfig(getDefaultConfig(product.id, variantId));
    sessionStorage.removeItem(STORAGE_KEY);
    setSearchParams({ step: '1' }, { replace: true });
  }, [product.id, variantId, setSearchParams]);

  // Pricing Calculation (via backend)
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown>({
    frame: Number(product.price) || 0,
    lens: 0,
    coating: 0,
    discount: 0,
    subtotal: Number(product.price) || 0,
  });

  useEffect(() => {
  let active = true;

  // Don't hit the API until user has picked a lens type.
  // Before that, show frame price only (no server round-trip needed).
  if (!config.lensTypeId) {
    setPriceBreakdown({
      frame: Number(product.price) || 0,
      lens: 0,
      coating: 0,
      discount: 0,
      subtotal: Number(product.price) || 0,
    });
    return;
  }

  async function fetchPricing() {
    try {
      const result = await calculatePricing({
        productId: product.id,
        variantId,
        lensTypeId: config.lensTypeId || undefined,
        addOnIds: config.coatingIds,
      });

      if (active && result) {
        setPriceBreakdown({
          frame: Number(result.framePrice) || 0,
          lens: Number(result.lensPrice) || 0,
          coating: Number(result.addOnPrice) || 0,
          discount: Number(result.discount) || 0,
          subtotal: Number(result.subtotal) || 0,
        });
      }
    } catch (err) {
      console.error('Failed to calculate pricing', err);
    }
  }

  fetchPricing();
  return () => { active = false; };
}, [product.id, product.price, variantId, config.lensTypeId, config.coatingIds]);

  // Validation
  const validateLensStep = useCallback(() => {
    // Expert Recommendation is a valid selection — no lens type needed.
    return config.lensTypeId !== null || config.expertAssistance === true;
  }, [config.lensTypeId, config.expertAssistance]);

  const validatePrescriptionStep = useCallback(() => {
    // Frame-only: no prescription needed.
    if (config.lensTypeId === 'frame-only') return true;
    // Expert mode: prescription upload is required so the expert can review it.
    // Any status except the initial undefined/pending counts as provided.
    return config.prescription !== undefined && config.prescription.status !== 'pending';
  }, [config.lensTypeId, config.prescription]);

  const validateCoatingStep = useCallback(() => {
    // Coatings are optional, so always valid
    return true;
  }, []);

  const validateStep = useCallback((stepIndex: number) => {
    switch (stepIndex) {
      case 1: return validateLensStep();
      case 2: return validatePrescriptionStep();
      case 3: return validateCoatingStep();
      case 4: return true; // Review step
      default: return false;
    }
  }, [validateLensStep, validatePrescriptionStep, validateCoatingStep]);

  const isComplete = useCallback(() => {
    return validateStep(1) && validateStep(2) && validateStep(3);
  }, [validateStep]);

  // Navigation
  const goToStep = useCallback((step: number) => {
    // Ensure we can't skip ahead without validation
    if (step > currentStep) {
      for (let i = currentStep; i < step; i++) {
        if (!validateStep(i)) return; // Block navigation
      }
    }
    const params = new URLSearchParams(searchParams);
    params.set('step', step.toString());
    setSearchParams(params);
  }, [currentStep, searchParams, setSearchParams, validateStep]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      // If frame-only is selected, skip prescription and coating directly to review (step 4)
      if (currentStep === 1 && config.lensTypeId === 'frame-only') {
        goToStep(4);
      } else {
        goToStep(currentStep + 1);
      }
    }
  }, [currentStep, validateStep, goToStep, config.lensTypeId]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      if (currentStep === 4 && config.lensTypeId === 'frame-only') {
        goToStep(1);
      } else {
        goToStep(currentStep - 1);
      }
    }
  }, [currentStep, goToStep, config.lensTypeId]);

  const value = useMemo(() => ({
    config,
    product,
    catalogue,
    priceBreakdown,
    currentStep,
    setLensType,
    toggleCoating,
    setPrescriptionStatus,
    setExpertAssistance,
    setCustomerNotes,
    nextStep,
    previousStep,
    goToStep,
    validateStep,
    isComplete,
    reset
  }), [config, product, catalogue, priceBreakdown, currentStep, setLensType, toggleCoating, setPrescriptionStatus, setExpertAssistance, setCustomerNotes, nextStep, previousStep, goToStep, validateStep, isComplete, reset]);

  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
    </ConfiguratorContext.Provider>
  );
}

export function useConfigurator() {
  const context = useContext(ConfiguratorContext);
  if (context === undefined) {
    throw new Error('useConfigurator must be used within a ConfiguratorProvider');
  }
  return context;
}