import { motion, AnimatePresence } from 'framer-motion';
import { PokeballAnimation } from './PokeballAnimation';

interface ThreePokeballProgressProps {
  color: string;                    // Gym color
  currentStep: 1 | 2 | 3;          // Active step
  step1Complete: boolean;           // Word said
  step2Complete: boolean;           // Letters spelled
  step3Complete: boolean;           // Word said again
  step1Text?: string | null;        // "Pizzaria" (detected word)
  step2Text?: string;               // "P-I-Z-..." (detected letters)
  isSubmitting?: boolean;           // Show submitting state
  timeRemaining?: number;           // Time remaining for recording
}

/**
 * Three Pokeball Progress Indicator
 *
 * Visual progress for the 3-step recording pattern:
 * 1. Say the word
 * 2. Spell it letter by letter
 * 3. Say the word again
 *
 * Each pokeball shows:
 * - Inactive: Gray, no animation
 * - Active: Gym color, pulsing with ⚡
 * - Complete: Green with ✓
 */
export function ThreePokeballProgress({
  color,
  currentStep,
  step1Complete,
  step2Complete,
  step3Complete,
  step1Text,
  step2Text,
  isSubmitting = false,
  timeRemaining,
}: ThreePokeballProgressProps) {
  const pokeballs = [
    {
      step: 1 as const,
      label: "Say the Word",
      isComplete: step1Complete,
      isActive: currentStep === 1,
      text: step1Text,
    },
    {
      step: 2 as const,
      label: "Spell It",
      isComplete: step2Complete,
      isActive: currentStep === 2,
      text: step2Text,
    },
    {
      step: 3 as const,
      label: "Say Again",
      isComplete: step3Complete,
      isActive: currentStep === 3,
      text: null,
    },
  ];

  const getPokeballState = (pb: typeof pokeballs[0]) => {
    if (pb.isComplete) return 'idle';
    if (pb.isActive) return 'pulsing';
    return 'idle';
  };

  const getPokeballColor = (pb: typeof pokeballs[0]) => {
    if (pb.isComplete) return '#10b981'; // Green
    if (pb.isActive) return color;       // Gym color
    return '#9ca3af';                    // Gray
  };

  return (
    <div className="card">
      {/* Pokeball progress row */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {pokeballs.map((pb, index) => (
          <div key={pb.step} className="flex items-center">
            {/* Pokeball container */}
            <motion.div
              className="relative flex flex-col items-center"
              animate={{
                scale: pb.isActive ? 1.05 : 1,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
            >
              {/* Pokeball animation */}
              <div className="relative">
                <motion.div
                  animate={{
                    rotate: pb.isComplete ? [0, 5, -5, 0] : 0,
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: pb.isComplete ? Infinity : 0,
                    ease: "easeInOut",
                  }}
                >
                  <PokeballAnimation
                    state={getPokeballState(pb)}
                    color={getPokeballColor(pb)}
                    size={pb.isActive ? 90 : 80}
                  />
                </motion.div>

                {/* Status icon overlay */}
                <AnimatePresence>
                  {pb.isComplete && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute inset-0 flex items-center justify-center text-4xl pointer-events-none"
                    >
                      ✓
                    </motion.div>
                  )}
                  {pb.isActive && !pb.isComplete && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute -top-2 -right-2 text-2xl"
                    >
                      ⚡
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Step label */}
              <p
                className="text-xs font-medium mt-2 text-center max-w-[80px]"
                style={{
                  color: pb.isActive ? color : pb.isComplete ? '#10b981' : '#9ca3af',
                }}
              >
                {pb.label}
              </p>
            </motion.div>

            {/* Arrow between pokeballs */}
            {index < pokeballs.length - 1 && (
              <motion.div
                className="text-2xl mx-2"
                style={{
                  color: pokeballs[index].isComplete ? color : '#9ca3af',
                }}
                animate={{
                  scale: pokeballs[index].isComplete ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  repeat: pokeballs[index].isComplete && !pokeballs[index + 1].isComplete ? Infinity : 0,
                }}
              >
                →
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Detected text display - ONLY show spelling, NOT the word */}
      <AnimatePresence mode="wait">
        {step2Text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-4 p-3 rounded-lg text-center"
            style={{ backgroundColor: `${color}10` }}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-text-muted">Spelling:</span>
              <span className="font-bold font-mono" style={{ color }}>
                {step2Text}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submission countdown (auto-submit, no manual buttons) */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="p-4 rounded-lg border-2 border-success bg-success/10 text-center"
          >
            <div className="text-2xl font-bold text-success mb-1">
              Perfect! ✨
            </div>
            <div className="text-lg text-text-secondary">
              Submitting in 2 seconds...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time remaining */}
      {timeRemaining !== undefined && !isSubmitting && (
        <div className="text-center text-sm text-text-muted mt-2">
          Time remaining: <span className="font-bold">{timeRemaining}s</span>
        </div>
      )}
    </div>
  );
}
