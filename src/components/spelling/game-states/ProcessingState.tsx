import { PokeballAnimation } from '../pokemon/PokeballAnimation';
import { TrainerEncouragement } from '../pokemon/TrainerEncouragement';

interface ProcessingStateProps {
  color: string;
}

/**
 * PROCESSING state - Whisper transcription in progress
 *
 * Features:
 * - Pokeball spinning animation
 * - "Checking your answer..." message
 * - Indicates AI is processing the recording
 */
export function ProcessingState({ color }: ProcessingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <PokeballAnimation state="spinning" color={color} size={140} />
      <TrainerEncouragement gameState="PROCESSING" color={color} />
      <p className="text-text-muted text-center max-w-sm">
        Processing your spelling...
      </p>
    </div>
  );
}
