import { motion } from 'framer-motion';

interface EeveeProcessingProps {
  gymColor: string;
}

/**
 * Eevee Processing Animation
 *
 * Shows Eevee with evolution sparkles orbiting around
 * while AI checks the spelling answer
 */
export function EeveeProcessing({ gymColor }: EeveeProcessingProps) {
  // Evolution type sparkles (representing Eevee's evolutions)
  const evolutionSparkles = [
    { emoji: '⚡', color: '#F7D02C', name: 'Jolteon' },      // Electric - yellow
    { emoji: '💧', color: '#6890F0', name: 'Vaporeon' },    // Water - blue
    { emoji: '🔥', color: '#F08030', name: 'Flareon' },     // Fire - orange
    { emoji: '🌿', color: '#78C850', name: 'Leafeon' },     // Grass - green
    { emoji: '❄️', color: '#98D8D8', name: 'Glaceon' },     // Ice - cyan
    { emoji: '✨', color: '#F85888', name: 'Sylveon' },     // Fairy - pink
    { emoji: '🌙', color: '#705898', name: 'Umbreon' },     // Dark - purple
    { emoji: '☀️', color: '#F8D030', name: 'Espeon' },      // Psychic - yellow
  ];

  return (
    <div className="p-12 flex flex-col items-center justify-center space-y-6">
      {/* Main Eevee character with orbiting evolution sparkles */}
      <div className="relative flex items-center justify-center" style={{ width: '250px', height: '250px' }}>
        {/* Orbiting evolution sparkles */}
        {evolutionSparkles.map((sparkle, index) => {
          const angle = (index / evolutionSparkles.length) * 360;
          const orbitRadius = 100;

          return (
            <motion.div
              key={sparkle.name}
              className="absolute text-3xl"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
                delay: 0,
              }}
              style={{
                transformOrigin: 'center',
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.25,
                  ease: "easeInOut",
                }}
                style={{
                  position: 'absolute',
                  left: `${Math.cos((angle * Math.PI) / 180) * orbitRadius}px`,
                  top: `${Math.sin((angle * Math.PI) / 180) * orbitRadius}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {sparkle.emoji}
              </motion.div>
            </motion.div>
          );
        })}

        {/* Center Eevee character */}
        <motion.div
          className="absolute flex flex-col items-center"
          animate={{
            y: [0, -15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Eevee (using fox emoji) */}
          <motion.div
            className="text-8xl"
            animate={{
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            🦊
          </motion.div>

          {/* Glow effect behind Eevee */}
          <motion.div
            className="absolute inset-0 rounded-full blur-2xl opacity-40"
            style={{ backgroundColor: gymColor }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>

      {/* Message */}
      <motion.div
        className="text-center space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.p
          className="text-2xl font-bold"
          style={{ color: gymColor }}
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          Eevee is checking your spelling!
        </motion.p>

        {/* Animated dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: gymColor }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <motion.p
          className="text-sm text-text-muted"
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          Analyzing with AI magic... ✨
        </motion.p>
      </motion.div>
    </div>
  );
}
