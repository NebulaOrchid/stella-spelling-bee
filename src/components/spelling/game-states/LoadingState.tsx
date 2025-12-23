import { PokeballAnimation } from '../pokemon/PokeballAnimation';
import { TrainerEncouragement } from '../pokemon/TrainerEncouragement';

interface LoadingStateProps {
  color: string;
}

/**
 * LOADING state - Word pronunciation with Pokeball wobble
 *
 * Features:
 * - Pokeball wobbling animation
 * - "Listen carefully, Trainer!" message
 * - Word audio auto-plays in background (handled by parent)
 */
export function LoadingState({ color }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <PokeballAnimation state="wobbling" color={color} size={140} />
      <TrainerEncouragement gameState="LOADING" color={color} />
      <p className="text-text-muted text-center max-w-sm">
        The word is being pronounced. Listen carefully!
      </p>
    </div>
  );
}
