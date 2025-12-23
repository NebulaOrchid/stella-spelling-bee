import { motion } from 'framer-motion';

export type PokeballState = 'wobbling' | 'pulsing' | 'spinning' | 'bursting' | 'escaping' | 'idle';

interface PokeballAnimationProps {
  state: PokeballState;
  color?: string;
  size?: number;
}

/**
 * Pokemon-themed Pokeball animation component
 *
 * States:
 * - wobbling: Gentle shake during LOADING (word playing)
 * - pulsing: Pulse with each pattern step during RECORDING
 * - spinning: Fast spin during PROCESSING (Whisper transcription)
 * - bursting: Opens and bursts with particles on CORRECT answer
 * - escaping: Shakes and escapes on INCORRECT answer
 * - idle: Static pokeball
 */
export function PokeballAnimation({ state, color = '#ef4444', size = 120 }: PokeballAnimationProps) {
  // Animation variants for different states
  const variants = {
    wobbling: {
      rotate: [0, -5, 5, -5, 5, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity as number,
        ease: "easeInOut" as const,
      },
    },
    pulsing: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity as number,
        ease: "easeInOut" as const,
      },
    },
    spinning: {
      rotate: 360,
      transition: {
        duration: 0.8,
        repeat: Infinity as number,
        ease: "linear" as const,
      },
    },
    bursting: {
      scale: [1, 1.2, 0],
      opacity: [1, 1, 0],
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
    escaping: {
      x: [0, -10, 10, -8, 8, -5, 5, 0],
      rotate: [0, -15, 15, -10, 10, -5, 5, 0],
      transition: {
        duration: 0.8,
        ease: "easeInOut" as const,
      },
    },
    idle: {
      scale: 1,
      rotate: 0,
      opacity: 1,
    },
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Pokeball */}
      <motion.div
        animate={state}
        variants={variants}
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Top half (red) */}
        <div
          className="absolute top-0 left-0 right-0 rounded-t-full"
          style={{
            height: size / 2,
            backgroundColor: color,
            borderBottom: `${size * 0.06}px solid #1f2937`,
          }}
        />

        {/* Bottom half (white) */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-white rounded-b-full"
          style={{
            height: size / 2,
            borderTop: `${size * 0.06}px solid #1f2937`,
          }}
        />

        {/* Center button */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full border-4 border-gray-800 flex items-center justify-center"
          style={{
            width: size * 0.3,
            height: size * 0.3,
          }}
        >
          <div
            className="rounded-full bg-white"
            style={{
              width: size * 0.15,
              height: size * 0.15,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
            }}
          />
        </div>
      </motion.div>

      {/* Burst particles (shown only during bursting) */}
      {state === 'bursting' && (
        <>
          {[...Array(8)].map((_, i) => {
            const angle = (i * 360) / 8;
            const distance = size * 0.8;
            const x = Math.cos((angle * Math.PI) / 180) * distance;
            const y = Math.sin((angle * Math.PI) / 180) * distance;

            return (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x,
                  y,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.6,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </>
      )}

      {/* Sparkles (shown during bursting) */}
      {state === 'bursting' && (
        <>
          {[...Array(12)].map((_, i) => {
            const angle = (i * 360) / 12;
            const distance = size * 0.5 + Math.random() * size * 0.3;
            const x = Math.cos((angle * Math.PI) / 180) * distance;
            const y = Math.sin((angle * Math.PI) / 180) * distance;

            return (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute top-1/2 left-1/2"
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x,
                  y,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.2 + Math.random() * 0.2,
                  ease: 'easeOut',
                }}
              >
                <span className="text-2xl">✨</span>
              </motion.div>
            );
          })}
        </>
      )}
    </div>
  );
}
