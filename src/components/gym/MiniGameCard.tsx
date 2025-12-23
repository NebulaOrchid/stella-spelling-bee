import { Button } from '../common/Button';
import { StarDisplay } from './StarDisplay';
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
 */
export function MiniGameCard({ miniGame, progress, gymColor, onPlay }: MiniGameCardProps) {
  const wordCount = miniGame.wordIds.length;

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
