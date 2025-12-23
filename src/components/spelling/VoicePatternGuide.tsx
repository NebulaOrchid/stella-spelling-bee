import { motion, AnimatePresence } from 'framer-motion';
import type { PatternState } from '../../hooks/usePatternVoiceRecording';

interface VoicePatternGuideProps {
  patternState: PatternState;
  expectedWord: string;
  detectedFirstWord: string | null;
  detectedLetters: string[];
  detectedSecondWord: string | null;
  timeRemaining: number;
}

/**
 * Visual guide showing the pattern detection progress
 * Guides user through: word → spell → word → submit
 */
export function VoicePatternGuide({
  patternState,
  expectedWord,
  detectedFirstWord,
  detectedLetters,
  detectedSecondWord,
  timeRemaining,
}: VoicePatternGuideProps) {
  const steps = [
    {
      key: 'first-word',
      label: 'Say the word',
      example: expectedWord,
      completed: detectedFirstWord !== null,
      active: patternState === 'WAITING_FOR_FIRST_WORD',
      value: detectedFirstWord,
    },
    {
      key: 'spelling',
      label: 'Spell it',
      example: expectedWord.toUpperCase().split('').join(' - '),
      completed: detectedLetters.length >= expectedWord.length,
      active: patternState === 'WAITING_FOR_SPELLING',
      value: detectedLetters.join(' ').toUpperCase(),
    },
    {
      key: 'second-word',
      label: 'Say it again',
      example: expectedWord,
      completed: detectedSecondWord !== null,
      active: patternState === 'WAITING_FOR_SECOND_WORD',
      value: detectedSecondWord,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Pattern Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-2 transition-all ${
              step.completed
                ? 'border-success bg-success/10'
                : step.active
                ? 'border-primary bg-primary/10 shadow-lg scale-105'
                : 'border-surface bg-surface/50 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {/* Step number */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.completed
                        ? 'bg-success text-white'
                        : step.active
                        ? 'bg-primary text-white'
                        : 'bg-surface text-text-muted'
                    }`}
                  >
                    {step.completed ? '✓' : index + 1}
                  </div>

                  {/* Step label */}
                  <div>
                    <div className="font-semibold text-lg">{step.label}</div>
                    <div className="text-sm text-text-muted">
                      e.g., "{step.example}"
                    </div>
                  </div>
                </div>

                {/* Detected value */}
                <AnimatePresence>
                  {step.value && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-2 ml-10"
                    >
                      <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary font-bold">
                        {step.value}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pulsing indicator for active step */}
              {step.active && !step.completed && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Submission countdown */}
      <AnimatePresence>
        {patternState === 'SUBMITTING' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="p-6 rounded-lg bg-success/20 border-2 border-success text-center"
          >
            <div className="text-3xl font-bold text-success mb-2">
              Perfect! ✨
            </div>
            <div className="text-xl text-text-secondary">
              Submitting in{' '}
              <motion.span
                key={Math.ceil((2000 - (Date.now() % 2000)) / 1000)}
                initial={{ scale: 1.5, color: '#22c55e' }}
                animate={{ scale: 1, color: 'inherit' }}
                className="font-bold"
              >
                2
              </motion.span>{' '}
              seconds...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer */}
      <div className="text-center text-sm text-text-muted">
        Time remaining: <span className="font-bold">{timeRemaining}s</span>
      </div>
    </div>
  );
}
