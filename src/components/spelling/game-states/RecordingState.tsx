import { PokeballAnimation } from '../pokemon/PokeballAnimation';
import { TrainerEncouragement } from '../pokemon/TrainerEncouragement';
import { SoundRipples } from '../pokemon/SoundRipples';

interface RecordingStateProps {
  color: string;
  timeRemaining: number;
  isRecording: boolean;
}

/**
 * RECORDING state - Active recording with countdown timer
 *
 * Features:
 * - Pokeball pulsing animation with sound ripples
 * - Countdown timer (60s → 0s)
 * - Recording indicator
 * - "Done" button shown in parent component
 */
export function RecordingState({ color, timeRemaining, isRecording }: RecordingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Pokeball with sound ripples */}
      <div className="relative">
        <SoundRipples
          color={color}
          isActive={isRecording}
          size={140}
        />
        <PokeballAnimation state="pulsing" color={color} size={140} />
      </div>

      {/* Trainer encouragement */}
      <TrainerEncouragement gameState="RECORDING" color={color} />

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <p className="text-sm font-medium text-text-muted">
            Recording...
          </p>
        </div>
      )}

      {/* Countdown timer */}
      <div className="text-center">
        <p className="text-5xl font-bold" style={{ color }}>
          {timeRemaining}s
        </p>
        <p className="text-sm text-text-muted mt-1">
          Time remaining
        </p>
      </div>
    </div>
  );
}
