import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface PokemonCelebrationProps {
  gymColor: string;
  gymEmoji: string;
  isCorrect: boolean;
}

/**
 * Pokemon Character Celebration Component
 *
 * Displays an animated emoji-based Pokemon character that reacts to results
 * Position: Bottom-right corner, 120px size
 *
 * Correct Answer: Victory jumps with encouraging message
 * Incorrect Answer: Thoughtful appearance with motivational message
 */
export function PokemonCelebration({ gymColor, gymEmoji, isCorrect }: PokemonCelebrationProps) {
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);

  useEffect(() => {
    // Show speech bubble after character appears
    const timeout = setTimeout(() => {
      setShowSpeechBubble(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  // Select character based on gym emoji or default to Pikachu-inspired
  const character = gymEmoji || '⚡';

  const messages = isCorrect
    ? [
        'Amazing! ⭐',
        'Perfect! 🎉',
        'Brilliant! ✨',
        'You did it! 🌟',
        'Awesome! 💫',
      ]
    : [
        'Try again! 💪',
        'Keep going! 🌟',
        "You've got this! ⭐",
        'Almost there! 💫',
        'Practice makes perfect! ✨',
      ];

  const message = messages[Math.floor(Math.random() * messages.length)];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        {/* Animated Pokemon Character */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
          className="relative"
        >
          {/* Character with victory jumps if correct */}
          <motion.div
            animate={
              isCorrect
                ? {
                    y: [0, -20, 0, -15, 0, -10, 0],
                    scale: [1, 1.1, 1, 1.08, 1, 1.05, 1],
                  }
                : {
                    scale: [1, 1.05, 1],
                  }
            }
            transition={
              isCorrect
                ? {
                    duration: 1.5,
                    times: [0, 0.2, 0.4, 0.6, 0.7, 0.85, 1],
                    repeat: Infinity,
                    repeatDelay: 1,
                  }
                : {
                    duration: 1.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
            className="text-8xl cursor-pointer"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
          >
            {character}
          </motion.div>

          {/* Confetti particles for correct answers */}
          {isCorrect && (
            <>
              {[0, 1, 2, 3, 4].map((i) => {
                const angle = (i / 5) * 360;
                const distance = 50;
                const x = Math.cos((angle * Math.PI) / 180) * distance;
                const y = Math.sin((angle * Math.PI) / 180) * distance;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      x: [0, x, x * 1.5],
                      y: [0, y, y * 1.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      delay: i * 0.1,
                    }}
                    className="absolute top-1/2 left-1/2 text-2xl"
                    style={{ pointerEvents: 'none' }}
                  >
                    {['⭐', '✨', '💫', '🌟', '⚡'][i]}
                  </motion.div>
                );
              })}
            </>
          )}
        </motion.div>

        {/* Speech Bubble */}
        <AnimatePresence>
          {showSpeechBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute -top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
            >
              <div
                className="px-4 py-2 rounded-2xl shadow-lg font-bold text-sm relative"
                style={{
                  backgroundColor: gymColor,
                  color: 'white',
                }}
              >
                {message}

                {/* Speech bubble tail */}
                <div
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: `8px solid ${gymColor}`,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
