import { PokeballAnimation } from '../pokemon/PokeballAnimation';
import { TrainerEncouragement } from '../pokemon/TrainerEncouragement';

interface ReadyStateProps {
  color: string;
}

/**
 * READY state - Pronunciation complete, ready to record
 *
 * Features:
 * - Pokeball idle (steady)
 * - "Ready to catch 'em all?" message
 * - Brief state before auto-starting recording
 */
export function ReadyState({ color }: ReadyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <PokeballAnimation state="idle" color={color} size={140} />
      <TrainerEncouragement gameState="READY" color={color} />
      <p className="text-text-muted text-center max-w-sm">
        Get ready! Recording will start in a moment...
      </p>
    </div>
  );
}
