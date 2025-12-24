import { motion } from 'framer-motion';
import type { Gym } from '../../types';

interface GymMapIconProps {
  gym: Gym;
  starsEarned: number;
  badgeUnlocked: boolean;
}

/**
 * Gym Map Icon - Pokemon character representing each gym
 * Shows gym emoji, stars earned, and badge status
 */
export function GymMapIcon({ gym, starsEarned, badgeUnlocked }: GymMapIconProps) {
  // Pokemon character emoji for each gym theme
  const getPokemonCharacter = (theme: string): string => {
    const pokemonMap: Record<string, string> = {
      Fire: '🦊', // Vulpix/Ninetales
      Water: '🐢', // Squirtle
      Electric: '⚡', // Pikachu
      Nature: '🌺', // Bulbasaur/Vileplume
      Ice: '❄️', // Ice crystal
      Rock: '🗿', // Rock formation
      Sky: '🕊️', // Pidgey
      Shadow: '🌙', // Ghastly
      Crystal: '💎', // Crystal
      Desert: '🦂', // Sandshrew/Scorpion
      Ocean: '🐋', // Wailord
      Forest: '🦌', // Sawsbuck
      Mountain: '🦅', // Mountain bird
      Star: '✨', // Staryu
      Dragon: '🐉', // Dragon
      Rainbow: '🦄', // Rainbow creature
      Thunder: '⚡', // Raikou
      Master: '👑', // Master/Champion
      Wrong: '🔄', // Ditto
    };

    return pokemonMap[theme] || gym.emoji;
  };

  const pokemonEmoji = getPokemonCharacter(gym.theme);

  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* Pokemon character circle */}
      <motion.div
        className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
        style={{
          backgroundColor: badgeUnlocked ? gym.color : '#94a3b8',
          border: `4px solid ${badgeUnlocked ? '#ffd700' : '#cbd5e1'}`,
        }}
        animate={{
          boxShadow: badgeUnlocked
            ? [
                `0 0 20px ${gym.color}80`,
                `0 0 30px ${gym.color}`,
                `0 0 20px ${gym.color}80`,
              ]
            : '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Pokemon emoji */}
        <span className="text-4xl">{pokemonEmoji}</span>

        {/* Badge indicator (golden ring when unlocked) */}
        {badgeUnlocked && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-yellow-400"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Gym name */}
      <div
        className="text-xs font-bold text-center px-2 py-1 rounded"
        style={{
          backgroundColor: `${gym.color}20`,
          color: gym.color,
        }}
      >
        {gym.name}
      </div>

      {/* Stars earned */}
      {starsEarned > 0 && (
        <div className="flex gap-0.5">
          {[1, 2, 3].map((star) => (
            <span
              key={star}
              className={star <= starsEarned ? 'text-yellow-400' : 'text-gray-300'}
              style={{ fontSize: '14px' }}
            >
              ⭐
            </span>
          ))}
        </div>
      )}

      {/* Badge earned icon */}
      {badgeUnlocked && (
        <motion.div
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        >
          <span className="text-lg">🏅</span>
        </motion.div>
      )}

      {/* Special indicator for Wrong Gym */}
      {gym.type === 'wrong' && (
        <div className="absolute -bottom-8 text-xs text-center text-text-muted italic">
          Ditto's Island
        </div>
      )}
    </div>
  );
}
