import { motion } from 'framer-motion';

interface GymPokemonAssistantProps {
  gymType: string;
  isListening: boolean; // true during pronunciation
  isRecording: boolean; // true during recording
  gymColor: string;
}

/**
 * Gym Leader's Pokemon Assistant
 *
 * Shows a gym-themed Pokemon that reacts to game state:
 * - Listening pose during pronunciation
 * - Excited speaking pose during recording
 */

// Map gym types to Pokemon characters
const getPokemonForGym = (gymType: string) => {
  const gymMap: Record<string, { pokemon: string; name: string }> = {
    electric: { pokemon: '⚡', name: 'Pikachu' },
    fire: { pokemon: '🔥', name: 'Charmander' },
    water: { pokemon: '💧', name: 'Squirtle' },
    grass: { pokemon: '🌿', name: 'Bulbasaur' },
    rock: { pokemon: '🪨', name: 'Geodude' },
    ghost: { pokemon: '👻', name: 'Gastly' },
    psychic: { pokemon: '🔮', name: 'Abra' },
    ice: { pokemon: '❄️', name: 'Seel' },
    dragon: { pokemon: '🐉', name: 'Dratini' },
    default: { pokemon: '⚡', name: 'Pikachu' },
  };

  const key = gymType.toLowerCase();
  return gymMap[key] || gymMap.default;
};

export function GymPokemonAssistant({
  gymType,
  isListening,
  isRecording,
  gymColor,
}: GymPokemonAssistantProps) {
  const { pokemon, name } = getPokemonForGym(gymType);

  // Get message based on state
  const getMessage = () => {
    if (isListening) {
      return `${name} is listening!`;
    }
    if (isRecording) {
      return `${name} wants to hear you spell!`;
    }
    return `Ready with ${name}!`;
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Pokemon Character */}
      <motion.div
        className="relative"
        animate={
          isRecording
            ? {
                // Excited jumping during recording
                y: [0, -15, 0, -10, 0],
                scale: [1, 1.1, 1, 1.05, 1],
              }
            : isListening
            ? {
                // Gentle listening animation
                rotate: [0, -5, 5, -5, 0],
                scale: [1, 1.05, 1],
              }
            : {
                // Idle gentle bounce
                y: [0, -5, 0],
                scale: [1, 1.02, 1],
              }
        }
        transition={{
          duration: isRecording ? 1.5 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className="text-6xl drop-shadow-lg"
          style={{
            filter: `drop-shadow(0 0 10px ${gymColor}40)`,
          }}
        >
          {pokemon}
        </div>

        {/* Listening indicator - ear icon */}
        {isListening && (
          <motion.div
            className="absolute -right-2 -top-2 text-2xl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            👂
          </motion.div>
        )}

        {/* Recording indicator - microphone icon */}
        {isRecording && (
          <motion.div
            className="absolute -right-2 -top-2 text-2xl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            🎤
          </motion.div>
        )}

        {/* Sound waves during listening */}
        {isListening && (
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: [0.5, 1, 0.5], x: [-10, -20, -10] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-2xl">〰️</span>
          </motion.div>
        )}

        {/* Energy burst during recording */}
        {isRecording && (
          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [1, 0], scale: [0.5, 1.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="text-2xl">✨</span>
          </motion.div>
        )}
      </motion.div>

      {/* Speech Bubble */}
      <motion.div
        className="relative bg-white rounded-2xl px-4 py-2 shadow-lg max-w-[180px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          borderColor: gymColor,
          borderWidth: '2px',
          borderStyle: 'solid',
        }}
      >
        {/* Speech bubble tail */}
        <div
          className="absolute left-0 top-1/2 -translate-x-2 -translate-y-1/2 w-0 h-0"
          style={{
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: `12px solid ${gymColor}`,
          }}
        />

        <p
          className="text-sm font-semibold text-center leading-tight"
          style={{ color: gymColor }}
        >
          {getMessage()}
        </p>
      </motion.div>
    </div>
  );
}
