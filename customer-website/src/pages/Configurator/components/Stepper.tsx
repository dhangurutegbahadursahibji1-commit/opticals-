import { RiCheckLine } from 'react-icons/ri';
import { useConfigurator } from '../../../context/ConfiguratorContext';

const STEPS = ['Lens', 'Prescription', 'Coating', 'Review'];

export default function Stepper() {
  const { currentStep, goToStep, validateStep } = useConfigurator();

  return (
    <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = currentStep === stepNum;
        const isPast = currentStep > stepNum;
        // A step is clickable if the step before it is valid (meaning we can reach it) or if we are already past it.
        // Actually, logic is: step 1 is always reachable. Step N is reachable if step N-1 is valid.
        let isClickable = false;
        if (stepNum === 1) isClickable = true;
        else if (isPast) isClickable = true;
        else {
           // We can click ahead ONLY if all prior steps are valid
           let allValid = true;
           for(let i=1; i<stepNum; i++){
             if(!validateStep(i)) allValid = false;
           }
           isClickable = allValid;
        }

        return (
          <div key={step} className="flex items-center">
            <button
              onClick={() => isClickable && goToStep(stepNum)}
              disabled={!isClickable && !isActive}
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-accent bg-accent text-white'
                  : isPast
                  ? 'border-primary bg-primary text-white'
                  : 'border-primary/20 text-primary/40'
              }`}
            >
              {isPast ? <RiCheckLine /> : stepNum}
            </button>
            <span className={`ml-3 text-sm font-medium hidden sm:block ${isActive || isPast ? 'text-primary' : 'text-primary/40'}`}>
              {step}
            </span>
            {idx < STEPS.length - 1 && (
              <div className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 ${isPast ? 'bg-primary' : 'bg-primary/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
