import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Button } from '../common/Button';
import { useSpelling } from '../../contexts/SpellingContext';
import { useGym } from '../../contexts/GymContext';
import { soundManager } from '../../services/sound';
import { InteractiveWordTracing } from './pokemon/InteractiveWordTracing';
import { PokemonCelebration } from './pokemon/PokemonCelebration';

export function Feedback() {
  const { isCorrect, currentWord, currentAttempt, nextWord } = useSpelling();
  const { selectedGym } = useGym();

  const gymColor = selectedGym?.color || '#3b82f6';
  const gymEmoji = selectedGym?.emoji || '⚡';

  // Play sound effects and trigger enhanced confetti
  useEffect(() => {
    if (isCorrect === null) return;

    // Play sound effect
    if (isCorrect) {
      soundManager.playEffect('correct').catch(console.error);

      // ENHANCED MULTI-STAGE CONFETTI
      // Stage 1: Initial center burst (200 particles)
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: [gymColor, '#ffd700', '#ffffff', '#ff6b9d'],
        startVelocity: 45,
        gravity: 0.8,
        scalar: 1.2,
      });

      // Stage 2: Side cannons (delayed 200ms)
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: [gymColor, '#ffd700'],
        });
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: [gymColor, '#ffd700'],
        });
      }, 200);

      // Stage 3: Pokeball rain (delayed 400ms)
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 360,
          origin: { y: 0 },
          shapes: ['circle'],
          colors: ['#ef4444', '#ffffff'],
          gravity: 0.5,
        });
      }, 400);
    } else {
      soundManager.playEffect('incorrect').catch(console.error);
    }
  }, [isCorrect, gymColor]);

  if (isCorrect === null || !currentWord) return null;

  return (
    <>
      {/* Pokemon Celebration Character */}
      <PokemonCelebration
        gymColor={gymColor}
        gymEmoji={gymEmoji}
        isCorrect={isCorrect}
      />

      <div className={`card ${isCorrect ? 'bg-success/10 border-2 border-success' : 'bg-error/10 border-2 border-error'}`}>
        <div className="text-center space-y-6">
          {/* CORRECT ANSWER */}
          {isCorrect && (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-8xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-success">Perfect!</h2>
              </motion.div>

              {/* Interactive Word Tracing - THE MAIN FOCUS */}
              <motion.div
                className="my-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-lg text-text-muted mb-4">You spelled:</p>

                <InteractiveWordTracing
                  word={currentWord.word}
                  color={gymColor}
                />
              </motion.div>

              {/* Definition card */}
              {currentWord.definition && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="card max-w-md mx-auto"
                >
                  <p className="text-center text-text-muted italic">
                    {currentWord.definition}
                  </p>
                </motion.div>
              )}

              {/* Star progress indicator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="p-4 rounded-lg"
                style={{ backgroundColor: `${gymColor}20` }}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <p className="text-sm font-semibold" style={{ color: gymColor }}>
                    Perfect spelling earns stars!
                  </p>
                </div>
              </motion.div>

              {/* Success message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-xl font-bold"
                style={{ color: gymColor }}
              >
                Amazing work! Keep it up! 🌟
              </motion.p>
            </>
          )}

          {/* INCORRECT ANSWER */}
          {!isCorrect && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-8xl mb-4">😊</div>
                <h2 className="text-3xl font-bold text-error">Not quite!</h2>
              </motion.div>

              <div className="space-y-4">
                <motion.p
                  className="text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="font-semibold">You spelled:</span>{' '}
                  <span className="text-error font-bold text-2xl">{currentAttempt}</span>
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-lg mb-4">
                    <span className="font-semibold">Correct spelling:</span>
                  </p>

                  <InteractiveWordTracing
                    word={currentWord.word}
                    color={gymColor}
                  />
                </motion.div>

                {/* Definition */}
                {currentWord.definition && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="card max-w-md mx-auto mt-4"
                  >
                    <p className="text-center text-text-muted italic">
                      {currentWord.definition}
                    </p>
                  </motion.div>
                )}

                <motion.p
                  className="text-sm text-text-muted mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  Don't worry! Keep practicing! 💪
                </motion.p>
              </div>
            </>
          )}

          {/* Next Word Button and Voice Commands */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            <Button variant="primary" size="lg" onClick={nextWord}>
              Next Word →
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
