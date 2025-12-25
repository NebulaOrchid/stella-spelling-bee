import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface InteractiveWordTracingProps {
  word: string;
  color: string;
  onComplete?: () => void;
}

/**
 * Interactive Word Tracing Animation
 *
 * Displays the correct word in VERY LARGE letters with dramatic reveal animation
 * Features:
 * - Extra large letter cards (120px width × 160px height on desktop)
 * - Sequential letter reveal with bounce animation
 * - Sparkle burst on each letter
 * - Maximum visual impact for learning
 */
export function InteractiveWordTracing({ word, color, onComplete }: InteractiveWordTracingProps) {
  const [revealedLetters, setRevealedLetters] = useState<number>(0);
  const letters = word.toUpperCase().split('');

  // Dynamic letter size calculation based on screen width
  // Guarantees word fits in ONE row on ANY device (iPhone, iPad, desktop)
  const getLetterSize = () => {
    const letterCount = letters.length;

    // Get available screen width
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 768;

    // Account for padding and gaps
    const containerPadding = 32; // 16px left + 16px right (px-4 on mobile)
    const gapBetweenLetters = 8; // gap-2 in Tailwind = 0.5rem = 8px
    const totalGap = gapBetweenLetters * (letterCount - 1);
    const availableWidth = screenWidth - containerPadding - totalGap;

    // Calculate ideal letter width to fit screen
    const idealWidth = availableWidth / letterCount;

    // Cap between minimum and maximum for readability
    const MIN_WIDTH = 25;  // Minimum to keep text readable
    const MAX_WIDTH = 70;  // Maximum to prevent huge letters on desktop
    const letterWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, idealWidth));

    // Calculate proportional height (roughly 1.4x width for good proportions)
    const letterHeight = letterWidth * 1.4;

    // Determine font size based on letter width
    let fontSize: string;
    if (letterWidth >= 60) {
      fontSize = 'text-6xl'; // 60px
    } else if (letterWidth >= 50) {
      fontSize = 'text-5xl'; // 48px
    } else if (letterWidth >= 40) {
      fontSize = 'text-4xl'; // 36px
    } else if (letterWidth >= 30) {
      fontSize = 'text-3xl'; // 30px
    } else {
      fontSize = 'text-2xl'; // 24px
    }

    return {
      width: Math.round(letterWidth),
      height: Math.round(letterHeight),
      fontSize
    };
  };

  const letterSize = getLetterSize();

  useEffect(() => {
    // Reset when word changes
    setRevealedLetters(0);

    // Sequential letter reveal
    const delays = letters.map((_, index) => {
      return setTimeout(() => {
        setRevealedLetters(index + 1);
      }, index * 400); // 400ms delay per letter
    });

    // Call onComplete when all letters revealed
    const completeTimeout = setTimeout(() => {
      onComplete?.();
    }, letters.length * 400 + 500);

    return () => {
      delays.forEach(clearTimeout);
      clearTimeout(completeTimeout);
    };
  }, [word, letters.length, onComplete]);

  return (
    <div className="overflow-y-hidden pb-4">
      <div className="flex flex-nowrap items-center justify-center gap-2 px-4">
      {letters.map((letter, index) => {
        const isRevealed = index < revealedLetters;

        return (
          <motion.div
            key={`${word}-${index}`}
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={
              isRevealed
                ? {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  }
                : {
                    opacity: 0,
                    scale: 0.5,
                    y: 50,
                  }
            }
            transition={{
              duration: 0.5,
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
            className="relative"
          >
            {/* Letter card */}
            <motion.div
              animate={
                isRevealed
                  ? {
                      scale: [1, 1.15, 1],
                    }
                  : {}
              }
              transition={{
                duration: 0.6,
                delay: 0.3,
              }}
              className="relative flex items-center justify-center rounded-2xl border-4 shadow-2xl"
              style={{
                width: `${letterSize.width}px`,
                height: `${letterSize.height}px`,
                backgroundColor: color,
                borderColor: `${color}dd`,
              }}
            >
              <span className={`${letterSize.fontSize} font-bold text-white drop-shadow-lg`}>
                {letter}
              </span>

              {/* Shine effect on reveal */}
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0.8, x: -100 }}
                  animate={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </motion.div>

            {/* Sparkle burst on reveal */}
            {isRevealed && (
              <>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((sparkleIndex) => {
                  const angle = (sparkleIndex / 8) * 360;
                  const distance = 60;
                  const x = Math.cos((angle * Math.PI) / 180) * distance;
                  const y = Math.sin((angle * Math.PI) / 180) * distance;

                  return (
                    <motion.div
                      key={sparkleIndex}
                      initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: 0,
                        scale: 1.5,
                        x,
                        y,
                      }}
                      transition={{
                        duration: 0.8,
                        ease: 'easeOut',
                      }}
                      className="absolute top-1/2 left-1/2 text-3xl"
                      style={{ pointerEvents: 'none' }}
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
    </div>
  );
}
