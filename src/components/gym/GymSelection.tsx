import { useGym } from '../../contexts/GymContext';
import { GymCard } from './GymCard';
import { ProgressStorage } from '../../services/storage/progressStorage';

/**
 * Gym Selection Screen
 * Shows all 19 gym badges in a grid with image-based cards
 */
export function GymSelection() {
  const { gyms, gymProgress, selectGym } = useGym();

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-primary mb-2">
          Spelling Gym Adventure
        </h1>
        <p className="text-xl text-text-secondary mb-4">
          Collect all 19 badges by mastering spelling challenges!
        </p>

        {/* Progress summary */}
        <div className="flex justify-center gap-8 text-lg">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⭐</span>
            <span className="font-bold">{gymProgress.totalStars}</span>
            <span className="text-text-muted">/ 57 stars</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">🏆</span>
            <span className="font-bold">{gymProgress.totalBadges}</span>
            <span className="text-text-muted">/ 19 badges</span>
          </div>
        </div>
      </div>

      {/* Gym grid - Portrait card layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
        {gyms.map(gym => {
          const progress = ProgressStorage.getGymProgress(gymProgress, gym.id);
          if (!progress) return null;

          return (
            <GymCard
              key={gym.id}
              gym={gym}
              stars={progress.starsEarned}
              onClick={() => selectGym(gym.id)}
            />
          );
        })}
      </div>

      {/* Instructions */}
      <div className="text-center mt-12 text-text-muted">
        <p className="text-sm">
          Click a gym to start your spelling challenge!
        </p>
        <p className="text-sm">
          Earn ⭐ by spelling all words correctly on the first try
        </p>
      </div>
    </div>
  );
}
