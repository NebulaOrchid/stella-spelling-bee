import { motion } from 'framer-motion';
import type { GameFlowState } from '../../../hooks/useGameFlow';

interface TrainerEncouragementProps {
  gameState: GameFlowState;
  color?: string;
}

/**
 * Pokemon trainer-style encouragement messages
 *
 * Displays context-aware messages based on game state:
 * - LOADING: "Listen carefully, Trainer!"
 * - READY: "Ready to catch 'em all?"
 * - RECORDING: "You've got this! Follow the steps!"
 * - PROCESSING: "Checking your answer..."
 * - REVEALING: "Let's see what you caught!"
 * - RESULT_CORRECT: "Gotcha! Perfect spelling!"
 * - RESULT_INCORRECT: "Good try! Let's catch 'em all!"
 */
export function TrainerEncouragement({ gameState, color = '#ef4444' }: TrainerEncouragementProps) {
  const messages: Record<GameFlowState, string> = {
    LOADING: "Listen carefully, Trainer!",
    READY: "Ready to catch 'em all?",
    RECORDING: "You've got this! Follow the steps!",
    PROCESSING: "Checking your answer...",
    REVEALING: "Let's see what you caught!",
    RESULT_CORRECT: "Gotcha! Perfect spelling!",
    RESULT_INCORRECT: "Good try! Let's catch 'em all!",
    TRANSITIONING: "On to the next challenge!",
  };

  const emojis: Record<GameFlowState, string> = {
    LOADING: "👂",
    READY: "💪",
    RECORDING: "🎤",
    PROCESSING: "⚙️",
    REVEALING: "✨",
    RESULT_CORRECT: "🎉",
    RESULT_INCORRECT: "💪",
    TRANSITIONING: "➡️",
  };

  const message = messages[gameState];
  const emoji = emojis[gameState];

  return (
    <motion.div
      key={gameState} // Re-mount on state change for animation
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="text-center"
    >
      <div className="flex items-center justify-center gap-2">
        <motion.span
          className="text-3xl"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          {emoji}
        </motion.span>
        <p
          className="text-lg font-bold"
          style={{ color }}
        >
          {message}
        </p>
      </div>
    </motion.div>
  );
}
