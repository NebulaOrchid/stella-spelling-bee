import { motion } from 'framer-motion';
import type { Gym, UserGymProgress } from '../../types';
import { GymMapIcon } from './GymMapIcon';

interface AdventureMapProps {
  gyms: Gym[];
  gymProgress: UserGymProgress;
  onSelectGym: (gymId: string) => void;
}

/**
 * Adventure Map - Top-down Pokemon-style world map
 * Gyms are positioned by theme in different terrain regions
 */
export function AdventureMap({ gyms, gymProgress, onSelectGym }: AdventureMapProps) {
  // Get progress for a specific gym
  const getGymProgress = (gymId: string) => {
    return gymProgress.gyms.find(gp => gp.gymId === gymId);
  };

  // Gym positions on the map (x, y as percentages)
  // Organized by terrain/theme regions
  const gymPositions: Record<string, { x: number; y: number }> = {
    // Fire region (bottom-left - volcano area)
    'gym-01': { x: 15, y: 75 }, // Flame Badge

    // Water/Ocean region (top-right - ocean area)
    'gym-02': { x: 75, y: 15 }, // Water Badge
    'gym-11': { x: 85, y: 25 }, // Ocean Badge

    // Electric region (middle-right - thunder plains)
    'gym-03': { x: 80, y: 50 }, // Electric Badge
    'gym-17': { x: 85, y: 60 }, // Thunder Badge

    // Nature/Forest region (middle-left - forest area)
    'gym-04': { x: 25, y: 45 }, // Nature Badge
    'gym-12': { x: 20, y: 35 }, // Forest Badge

    // Ice region (top-left - frozen tundra)
    'gym-05': { x: 20, y: 20 }, // Ice Badge

    // Rock/Mountain region (center-left - mountains)
    'gym-06': { x: 35, y: 30 }, // Rock Badge
    'gym-13': { x: 30, y: 55 }, // Mountain Badge

    // Sky region (top-center - clouds)
    'gym-07': { x: 50, y: 10 }, // Sky Badge

    // Shadow region (bottom-right - dark forest)
    'gym-08': { x: 70, y: 80 }, // Shadow Badge

    // Crystal region (center - crystal caves)
    'gym-09': { x: 50, y: 45 }, // Crystal Badge

    // Desert region (bottom-center - desert sands)
    'gym-10': { x: 45, y: 70 }, // Desert Badge

    // Star region (top-right above ocean)
    'gym-14': { x: 65, y: 5 }, // Star Badge

    // Dragon region (center-right - dragon's peak)
    'gym-15': { x: 60, y: 40 }, // Dragon Badge

    // Rainbow region (center-top - rainbow bridge)
    'gym-16': { x: 40, y: 15 }, // Rainbow Badge

    // Master region (exact center - master's temple)
    'gym-18': { x: 50, y: 50 }, // Master Badge

    // Wrong Gym (separate island - bottom-right corner)
    'gym-wrong': { x: 90, y: 90 }, // Wrong Gym (Ditto's Island)
  };

  return (
    <div className="relative w-full h-full min-h-[600px] overflow-auto">
      {/* Map container - large scrollable area */}
      <div className="relative w-[1200px] h-[900px] mx-auto">
        {/* Background terrain - CSS gradients for different regions */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `
              radial-gradient(circle at 15% 75%, rgba(239, 68, 68, 0.3) 0%, transparent 15%),
              radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 20%),
              radial-gradient(circle at 22% 40%, rgba(34, 197, 94, 0.3) 0%, transparent 18%),
              radial-gradient(circle at 20% 20%, rgba(6, 182, 212, 0.3) 0%, transparent 15%),
              radial-gradient(circle at 32% 42%, rgba(146, 64, 14, 0.3) 0%, transparent 12%),
              radial-gradient(circle at 45% 70%, rgba(249, 115, 22, 0.3) 0%, transparent 15%),
              radial-gradient(circle at 70% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 12%),
              radial-gradient(circle at 90% 90%, rgba(239, 68, 68, 0.2) 0%, transparent 8%),
              linear-gradient(180deg, #7dd3fc 0%, #22c55e 40%, #f97316 70%, #92400e 100%)
            `,
          }}
        >
          {/* Ocean waves effect */}
          <div
            className="absolute top-0 right-0 w-1/3 h-1/3 opacity-20"
            style={{
              background:
                'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59, 130, 246, 0.4) 10px, rgba(59, 130, 246, 0.4) 20px)',
            }}
          />

          {/* Mountain peaks */}
          <div
            className="absolute left-1/4 top-1/4 w-1/6 h-1/6 opacity-30"
            style={{
              background:
                'linear-gradient(135deg, transparent 40%, rgba(146, 64, 14, 0.6) 40%, rgba(146, 64, 14, 0.6) 60%, transparent 60%)',
            }}
          />

          {/* Forest pattern */}
          <div
            className="absolute left-1/5 top-1/3 w-1/8 h-1/8 opacity-20"
            style={{
              background:
                'radial-gradient(circle, rgba(34, 197, 94, 0.4) 2px, transparent 2px)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        {/* Gyms positioned on map */}
        {gyms.map((gym) => {
          const position = gymPositions[gym.id] || { x: 50, y: 50 };
          const progress = getGymProgress(gym.id);

          return (
            <motion.div
              key={gym.id}
              className="absolute cursor-pointer"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectGym(gym.id)}
            >
              <GymMapIcon
                gym={gym}
                starsEarned={progress?.starsEarned || 0}
                badgeUnlocked={progress?.badgeUnlocked || false}
              />
            </motion.div>
          );
        })}

        {/* Legend overlay - top-right corner */}
        <div className="absolute top-4 right-4 card p-4 bg-surface/90 backdrop-blur">
          <h3 className="text-sm font-bold mb-2">Your Journey</h3>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <span>{gymProgress.totalStars} Stars</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏅</span>
              <span>{gymProgress.totalBadges} Badges</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
