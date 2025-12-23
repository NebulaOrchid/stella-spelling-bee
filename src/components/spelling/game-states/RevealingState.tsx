import { PokeballAnimation } from '../pokemon/PokeballAnimation';
import { LetterRevealAnimation } from '../pokemon/LetterRevealAnimation';
import { TrainerEncouragement } from '../pokemon/TrainerEncouragement';

interface RevealingStateProps {
  word: string;
  isCorrect: boolean;
  color: string;
  onComplete: () => void;
}

/**
 * REVEALING state - Word reveal letter-by-letter animation
 *
 * Features:
 * - Pokeball bursts open (correct) or escapes (incorrect)
 * - Word appears letter-by-letter with sparkles
 * - Calls onComplete when animation finishes
 */
export function RevealingState({ word, isCorrect, color, onComplete }: RevealingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Pokeball animation */}
      <PokeballAnimation
        state={isCorrect ? 'bursting' : 'escaping'}
        color={color}
        size={140}
      />

      {/* Trainer message */}
      <TrainerEncouragement gameState="REVEALING" color={color} />

      {/* Letter-by-letter reveal */}
      <div className="mt-4">
        <LetterRevealAnimation
          word={word}
          isCorrect={isCorrect}
          color={color}
          onComplete={onComplete}
          speed={150}
        />
      </div>
    </div>
  );
}
