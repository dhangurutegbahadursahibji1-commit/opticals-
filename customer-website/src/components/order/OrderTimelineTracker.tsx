import { motion } from 'framer-motion';
import { RiCheckLine } from 'react-icons/ri';
import type { TimelineStep } from '../../services/api';

interface Props {
  steps: TimelineStep[];
}

export default function OrderTimelineTracker({ steps }: Props) {
  const lastCompletedIndex = steps.reduce(
    (acc, s, i) => (s.completed ? i : acc),
    -1,
  );
  const progressPercent =
    steps.length <= 1 ? 0 : (lastCompletedIndex / (steps.length - 1)) * 100;

  return (
    <div className="py-6">
      <div className="relative">
        {/* Track background */}
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-primary/10 dark:bg-white/10" />
        {/* Animated progress fill */}
        <motion.div
          className="absolute left-0 top-4 h-0.5 bg-accent origin-left"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="relative flex justify-between">
          {steps.map((step, i) => (
            <div key={step.step} className="flex flex-col items-center flex-1 min-w-0">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: 'easeOut' }}
                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 z-10 ${
                  step.completed
                    ? 'bg-accent border-accent text-white'
                    : 'bg-white dark:bg-dark-card border-primary/15 dark:border-white/15 text-muted'
                }`}
              >
                {step.completed ? (
                  <RiCheckLine className="text-base" />
                ) : (
                  <span className="text-[10px] font-medium">{i + 1}</span>
                )}
              </motion.div>
              <p
                className={`mt-2 text-[11px] text-center leading-tight px-1 ${
                  step.completed ? 'text-primary dark:text-white font-medium' : 'text-muted'
                }`}
              >
                {step.label}
              </p>
              {step.completedAt && (
                <p className="text-[10px] text-muted mt-0.5">
                  {new Date(step.completedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}