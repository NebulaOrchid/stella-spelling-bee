import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LetterRevealAnimationProps {
  word: string;
  isCorrect?: boolean;
  color?: string;
  onComplete?: () => void;
  speed?: number; // ms per letter
}

/**
 * Pokemon-style letter-by-letter word reveal animation
 *
 * Features:
 * - Letters appear one at a time with pop effect
 * - Sparkle particles on each letter reveal
 * - Color-coded (green for correct, red for incorrect, or custom color)
 * - Calls onComplete when animation finishes
 */
export function LetterRevealAnimation({
  word,
  isCorrect = true,
  color,
  onComplete,
  speed = 150,
}: LetterRevealAnimationProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const letters = word.toUpperCase().split('');

  // Determine color based on correctness if not provided
  const letterColor = color || (isCorrect ? '#10b981' : '#ef4444');

  // Reveal letters one by one
  useEffect(() => {
    if (revealedCount < letters.length) {
      const timer = setTimeout(() => {
        setRevealedCount((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (revealedCount === letters.length && onComplete) {
      // Call onComplete after last letter is revealed plus a small delay
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [revealedCount, letters.length, speed, onComplete]);

  return (
    <div className="flex justify-center items-center gap-2 flex-wrap">
      {letters.map((letter, index) => {
        const isRevealed = index < revealedCount;
        const isCurrentlyRevealing = index === revealedCount - 1;

        return (
          <motion.div
            key={index}
            className="relative"
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={
              isRevealed
                ? {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  }
                : {}
            }
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 25,
            }}
          >
            {/* Letter card */}
            <div
              className="relative w-12 h-16 sm:w-16 sm:h-20 rounded-lg flex items-center justify-center font-bold text-2xl sm:text-4xl shadow-lg"
              style={{
                backgroundColor: isRevealed ? letterColor : '#e5e7eb',
                color: isRevealed ? 'white' : '#9ca3af',
              }}
            >
              {letter}

              {/* Shine effect on reveal */}
              {isCurrentlyRevealing && (
                <motion.div
                  className="absolute inset-0 bg-white rounded-lg"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>

            {/* Sparkle particles on reveal */}
            {isCurrentlyRevealing && (
              <>
                {[...Array(4)].map((_, i) => {
                  const positions = [
                    { x: -20, y: -20 },
                    { x: 20, y: -20 },
                    { x: -20, y: 20 },
                    { x: 20, y: 20 },
                  ];
                  const pos = positions[i];

                  return (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 text-yellow-400"
                      initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                      animate={{
                        x: pos.x,
                        y: pos.y,
                        opacity: 0,
                        scale: 1,
                      }}
                      transition={{
                        duration: 0.5,
                        ease: 'easeOut',
                      }}
                    >
                      ✨
                    </motion.div>
                  );
                })}
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
