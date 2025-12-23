import type { Gym, GymProgress } from '../../types';

interface GymBadgeProps {
  gym: Gym;
  progress: GymProgress;
  onClick: () => void;
}

/**
 * Gym Badge Component
 * Shows a single gym badge with its unlock status and stars
 */
export function GymBadge({ gym, progress, onClick }: GymBadgeProps) {
  const { badgeUnlocked, starsEarned } = progress;

  // Calculate visual state
  const isLocked = starsEarned === 0;
  const inProgress = starsEarned > 0 && !badgeUnlocked;
  const unlocked = badgeUnlocked;

  // Calculate color saturation based on progress
  let filterStyle = {};
  if (isLocked) {
    filterStyle = { filter: 'grayscale(100%)', opacity: 0.5 };
  } else if (inProgress) {
    const colorPercent = (starsEarned / 3) * 100;
    filterStyle = { filter: `grayscale(${100 - colorPercent}%)`, opacity: 0.8 };
  } else if (unlocked) {
    filterStyle = { filter: 'grayscale(0%) brightness(1.2)', opacity: 1 };
  }

  return (
    <button
      onClick={onClick}
      className="relative p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 bg-surface"
      style={{
        borderColor: unlocked ? gym.color : '#d1d5db',
        boxShadow: unlocked ? `0 0 20px ${gym.color}40` : undefined,
        ...filterStyle,
      }}
    >
      {/* Badge emoji */}
      <div className="text-7xl mb-3">
        {gym.emoji}
      </div>

      {/* Badge name */}
      <div className="font-bold text-sm text-center mb-2">
        {gym.name}
      </div>

      {/* Stars indicator */}
      <div className="flex justify-center gap-1 text-2xl">
        {[1, 2, 3].map(i => (
          <span key={i} className={starsEarned >= i ? 'opacity-100' : 'opacity-20'}>
            {starsEarned >= i ? '⭐' : '☆'}
          </span>
        ))}
      </div>

      {/* Unlocked glow effect */}
      {unlocked && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none animate-pulse"
          style={{
            boxShadow: `inset 0 0 30px ${gym.color}30`,
          }}
        />
      )}
    </button>
  );
}
