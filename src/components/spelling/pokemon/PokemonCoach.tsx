import { motion, AnimatePresence } from 'framer-motion';

interface PokemonCoachProps {
  phase: 'listening' | 'recording' | 'processing';
  gymColor: string;
  gymType?: string;
}

/**
 * Pokemon Character Coach
 * An animated Pokemon companion that reacts to different game phases
 * - Listening: Pokemon has hand to ear, thoughtful expression
 * - Recording: Pokemon jumps excitedly, encouraging the player
 * - Processing: Pokemon does a thinking pose
 */
export function PokemonCoach({ phase, gymColor, gymType }: PokemonCoachProps) {
  // Select Pokemon character based on gym type
  const getPokemonCharacter = (gymType?: string): string => {
    if (!gymType) return '⚡'; // Default Pikachu

    const pokemonMap: Record<string, string> = {
      'Flame Badge': '🦊', // Vulpix
      'Water Badge': '🐢', // Squirtle
      'Electric Badge': '⚡', // Pikachu
      'Nature Badge': '🌺', // Bulbasaur/Vileplume
      'Ice Badge': '❄️', // Ice type
      'Rock Badge': '🗿', // Rock type
      'Sky Badge': '🕊️', // Flying type
      'Shadow Badge': '🌙', // Ghost type
      'Crystal Badge': '💎', // Crystal
      'Desert Badge': '🦂', // Ground type
      'Ocean Badge': '🐋', // Water type
      'Forest Badge': '🦌', // Grass type
      'Mountain Badge': '🦅', // Flying type
      'Star Badge': '✨', // Psychic type
      'Dragon Badge': '🐉', // Dragon
      'Rainbow Badge': '🦄', // Fairy type
      'Thunder Badge': '⚡', // Electric
      'Master Badge': '👑', // Special
      'Wrong Gym': '🔄', // Ditto
    };

    return pokemonMap[gymType] || '⚡';
  };

  const pokemon = getPokemonCharacter(gymType);

  // Get speech bubble text and Pokemon pose based on phase
  const getCoachState = () => {
    switch (phase) {
      case 'listening':
        return {
          text: 'Listen carefully! 👂',
          emoji: '🤔',
          animation: 'listening',
        };
      case 'recording':
        return {
          text: 'You got this! 🎤',
          emoji: '🤩',
          animation: 'encouraging',
        };
      case 'processing':
        return {
          text: 'Let me check... 🤔',
          emoji: '🤔',
          animation: 'thinking',
        };
    }
  };

  const state = getCoachState();

  // Animation variants for different poses
  const pokemonVariants = {
    listening: {
      y: [0, -5, 0],
      rotate: [0, -3, 0, 3, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
    encouraging: {
      y: [0, -15, 0, -10, 0],
      scale: [1, 1.1, 1, 1.05, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
    thinking: {
      y: [0, -3, 0],
      rotate: [0, 5, 0, -5, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  // Speech bubble variants
  const bubbleVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 500,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 10,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Pokemon Character */}
      <motion.div
        className="relative"
        variants={pokemonVariants}
        animate={state.animation}
      >
        {/* Pokemon emoji with background circle */}
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg relative"
          style={{
            backgroundColor: `${gymColor}30`,
            border: `3px solid ${gymColor}`,
          }}
        >
          <span className="text-6xl">{pokemon}</span>

          {/* Emotion overlay - small emoji in corner */}
          <motion.div
            className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 15,
              delay: 0.2,
            }}
          >
            <span className="text-2xl">{state.emoji}</span>
          </motion.div>

          {/* Pulsing glow effect during recording */}
          {phase === 'recording' && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: `2px solid ${gymColor}`,
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 0, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          )}
        </motion.div>

        {/* Hand gesture indicator - shown on left side */}
        {phase === 'listening' && (
          <motion.div
            className="absolute -left-8 top-1/2 -translate-y-1/2"
            animate={{
              x: [0, -5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <span className="text-3xl">👂</span>
          </motion.div>
        )}

        {/* Microphone indicator - shown on right side */}
        {phase === 'recording' && (
          <motion.div
            className="absolute -right-8 top-1/2 -translate-y-1/2"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <span className="text-3xl">🎤</span>
          </motion.div>
        )}

        {/* Sparkles during processing */}
        {phase === 'processing' && (
          <>
            <motion.div
              className="absolute -top-4 -left-4"
              animate={{
                y: [-5, -15, -5],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <span className="text-2xl">✨</span>
            </motion.div>
            <motion.div
              className="absolute -top-4 -right-4"
              animate={{
                y: [-5, -15, -5],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 0.5,
                ease: 'easeInOut',
              }}
            >
              <span className="text-2xl">✨</span>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          className="relative px-6 py-3 rounded-2xl shadow-md max-w-xs"
          style={{
            backgroundColor: `${gymColor}15`,
            border: `2px solid ${gymColor}80`,
          }}
          variants={bubbleVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Speech bubble pointer */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
            style={{
              backgroundColor: `${gymColor}15`,
              border: `2px solid ${gymColor}80`,
              borderBottom: 'none',
              borderRight: 'none',
            }}
          />

          {/* Speech text */}
          <p
            className="text-center font-bold text-lg relative z-10"
            style={{ color: gymColor }}
          >
            {state.text}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Encouraging message during recording */}
      {phase === 'recording' && (
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-sm text-text-muted italic">
            Say: Word → Spell it → Word again
          </span>
        </motion.div>
      )}
    </div>
  );
}
