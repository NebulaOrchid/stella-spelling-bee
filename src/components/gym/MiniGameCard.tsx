import { motion } from 'framer-motion';
import { Button } from '../common/Button';
import { StarDisplay } from './StarDisplay';
import { StarIcon } from './StarIcon';
import type { MiniGame, MiniGameProgress } from '../../types';

interface MiniGameCardProps {
  miniGame: MiniGame;
  progress: MiniGameProgress;
  gymColor: string;
  onPlay: () => void;
}

/**
 * Mini-Game Card Component
 * Shows a single mini-game within a gym with its star status
 * Supports image-based trainer cards with progressive lighting
 */
export function MiniGameCard({ miniGame, progress, gymColor, onPlay }: MiniGameCardProps) {
  const wordCount = miniGame.wordIds.length;
  const hasImage = miniGame.imageUrl && miniGame.imageUrl.trim() !== '';

  // Progressive lighting for images
  // 0 star (not completed): 60% grayscale
  // 1 star (completed): Fully bright (0% grayscale)
  const getImageFilter = () => {
    return progress.earnedStar
      ? 'grayscale(0%) brightness(1)'
      : 'grayscale(60%) brightness(0.8)';
  };

  // Image-based card (if imageUrl exists)
  if (hasImage) {
    return (
      <motion.div
        className="relative overflow-hidden rounded-2xl shadow-xl cursor-pointer group"
        onClick={onPlay}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {/* Trainer Image */}
        <img
          src={miniGame.imageUrl}
          alt={`Mini-game ${miniGame.order}`}
          className="w-full h-auto object-cover transition-all duration-700"
          style={{ filter: getImageFilter() }}
        />

        {/* Star overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 pb-4">
          <div className="flex items-center justify-center">
            <StarIcon
              filled={progress.earnedStar}
              color={gymColor}
              size={28}
              animate={false}
            />
          </div>
        </div>

        {/* Glow effect on hover */}
        <div
          className="absolute inset-0 transition-opacity duration-700 pointer-events-none opacity-0 group-hover:opacity-60"
          style={{
            boxShadow: `inset 0 0 40px ${gymColor}40, 0 0 30px ${gymColor}30`,
          }}
        />
      </motion.div>
    );
  }

  // Fallback: Original card design (for gyms without images)
  return (
    <div
      className="card border-2 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      style={{ borderColor: progress.earnedStar ? gymColor : '#e5e7eb' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Mini-game number */}
        <div className="text-5xl font-bold text-text-muted">
          #{miniGame.order}
        </div>

        {/* Star status */}
        <StarDisplay earned={progress.earnedStar} size="lg" />

        {/* Word count */}
        <div className="text-lg text-text-secondary">
          {wordCount} words
        </div>

        {/* Best score (if played before) */}
        {progress.attempts > 0 && (
          <div className="text-sm text-text-muted">
            Best: <span className="font-semibold">{progress.bestScore}/{wordCount}</span>
          </div>
        )}

        {/* Play/Replay button */}
        <Button
          variant={progress.completed ? 'secondary' : 'primary'}
          size="md"
          onClick={onPlay}
          style={{ backgroundColor: progress.earnedStar ? gymColor : undefined }}
        >
          {progress.completed ? 'Replay' : 'Play'}
        </Button>

        {/* Attempt count */}
        {progress.attempts > 0 && (
          <div className="text-xs text-text-muted">
            {progress.attempts} {progress.attempts === 1 ? 'attempt' : 'attempts'}
          </div>
        )}
      </div>
    </div>
  );
}
