import { motion, AnimatePresence } from 'framer-motion';
import type { PatternState } from '../../hooks/usePatternVoiceRecording';
import { Button } from '../common/Button';

interface PatternStepDisplayProps {
  patternState: PatternState;
  expectedWord: string;
  detectedFirstWord: string | null;
  detectedLetters: string[];
  detectedSecondWord: string | null;
  color: string;
  onFinishSpelling: () => void;
  onReplayWord: () => void;
}

/**
 * Pokemon Evolution style pattern step display
 *
 * Simple 3-step progression with Pokeballs
 * Does NOT show the actual word (hidden until after pattern complete)
 */
export function PatternStepDisplay({
  patternState,
  expectedWord,
  detectedFirstWord,
  detectedLetters,
  detectedSecondWord,
  color,
  onFinishSpelling,
  onReplayWord,
}: PatternStepDisplayProps) {
  const steps = [
    {
      key: 'first-word',
      stepNumber: 1,
      label: 'SAY THE WORD',
      completed: detectedFirstWord !== null,
      active: patternState === 'WAITING_FOR_FIRST_WORD',
      value: detectedFirstWord,
    },
    {
      key: 'spelling',
      stepNumber: 2,
      label: 'SPELL IT',
      completed: detectedLetters.length >= expectedWord.length,
      active: patternState === 'WAITING_FOR_SPELLING',
      value: detectedLetters.length > 0 ? detectedLetters.join(' - ').toUpperCase() : null,
    },
    {
      key: 'second-word',
      stepNumber: 3,
      label: 'SAY IT AGAIN',
      completed: detectedSecondWord !== null,
      active: patternState === 'WAITING_FOR_SECOND_WORD',
      value: detectedSecondWord,
    },
  ];

  // Determine which step is currently active
  const currentStepIndex = steps.findIndex(s => s.active);
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  return (
    <div className="card">
      {/* Pokemon Evolution Progress - Pokeballs in a row */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            {/* Pokeball */}
            <motion.div
              className="relative"
              animate={step.active ? { scale: [1, 1.15, 1] } : {}}
              transition={step.active ? { duration: 0.8, repeat: Infinity } : {}}
            >
              {/* Pokeball circle */}
              <div
                className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                  step.completed
                    ? 'bg-green-500 border-green-600'
                    : step.active
                    ? 'border-yellow-400'
                    : 'bg-gray-300 border-gray-400'
                }`}
                style={{
                  background: step.active && !step.completed
                    ? `linear-gradient(to bottom, ${color} 50%, white 50%)`
                    : undefined,
                  borderColor: step.active && !step.completed ? color : undefined,
                }}
              >
                {/* Center button */}
                <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-800" />

                {/* Status icon */}
                {step.completed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center text-2xl"
                  >
                    ✓
                  </motion.div>
                )}

                {step.active && !step.completed && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-1 -right-1 text-xl"
                  >
                    ⚡
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Arrow between Pokeballs */}
            {index < steps.length - 1 && (
              <div className="text-2xl text-gray-400 mx-2">→</div>
            )}
          </div>
        ))}
      </div>

      {/* Current step instruction */}
      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div
            key={currentStep.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🎤</span>
              <p className="text-xl font-bold" style={{ color }}>
                STEP {currentStep.stepNumber}: {currentStep.label}
              </p>
            </div>

            {/* Detected value */}
            <AnimatePresence>
              {currentStep.value && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-2"
                >
                  <div
                    className="inline-block px-4 py-2 rounded-lg text-lg font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {currentStep.value}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replay word button - available during all recording states */}
      <AnimatePresence>
        {['WAITING_FOR_FIRST_WORD', 'WAITING_FOR_SPELLING', 'WAITING_FOR_SECOND_WORD'].includes(patternState) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 flex justify-center"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={onReplayWord}
            >
              🔊 Replay Word
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual "Done Spelling" button for Step 2 */}
      <AnimatePresence>
        {patternState === 'WAITING_FOR_SPELLING' && detectedLetters.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 flex flex-col items-center gap-2"
          >
            <p className="text-sm text-text-muted text-center">
              Say the word again OR click button when done:
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={onFinishSpelling}
            >
              ✓ Done Spelling
            </Button>
            <p className="text-xs text-text-muted italic">
              (Auto-submit in 8 seconds after last letter)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submitting indicator */}
      <AnimatePresence>
        {patternState === 'SUBMITTING' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mt-4 p-4 rounded-lg text-center font-bold text-xl"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">✨</span>
              <span>Perfect! Submitting...</span>
              <span className="text-3xl">✨</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
