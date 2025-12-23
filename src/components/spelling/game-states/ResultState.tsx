import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LetterRevealAnimation } from '../pokemon/LetterRevealAnimation';
import { LetterComparisonDisplay } from '../pokemon/LetterComparisonDisplay';
import { TrainerEncouragement } from '../pokemon/TrainerEncouragement';
import { Button } from '../../common/Button';
import { useVoiceRecording } from '../../../hooks/useVoiceRecording';
import { soundManager } from '../../../services/sound/soundManager';
import { openAIService } from '../../../services/api';

interface ResultStateProps {
  word: string;
  definition?: string;
  isCorrect: boolean;
  userSpelling: string;
  color: string;
  onNextWord: () => void;
}

/**
 * RESULT state - Shows success or failure with Pokemon theme
 *
 * Correct variant:
 * - "Gotcha! 🎉" message
 * - Large letter display
 * - Definition card
 * - Confetti animation
 * - Next button + voice command
 *
 * Incorrect variant:
 * - "Oh no! It got away! 😊" message
 * - Letter comparison (✓/✗)
 * - Correct spelling shown large
 * - User spelling shown with feedback
 * - Trainer encouragement
 * - Next button + voice command
 */
export function ResultState({
  word,
  definition,
  isCorrect,
  userSpelling,
  color,
  onNextWord,
}: ResultStateProps) {
  // Voice command for "next word"
  const {
    isRecording: isListening,
    startRecording: startListening,
  } = useVoiceRecording();

  // Auto-start voice command listening
  useEffect(() => {
    const timer = setTimeout(() => {
      startListening();
    }, 1000);

    return () => clearTimeout(timer);
  }, [startListening]);

  // Play pronunciation
  const handlePlayWord = async () => {
    try {
      const text = definition
        ? `${word}. ${definition}. ${word}.`
        : `${word}. ${word}.`;
      const { audioUrl } = await openAIService.textToSpeech(text, 'nova', 1.0);
      await soundManager.playWord(audioUrl);
    } catch (error) {
      console.error('[ResultState] Error playing word:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="flex flex-col items-center justify-center gap-6 max-w-2xl mx-auto"
    >
      {/* Success or failure message */}
      <motion.h2
        className="text-4xl font-bold text-center"
        style={{ color }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {isCorrect ? (
          <>Gotcha! 🎉</>
        ) : (
          <>Oh no! It got away! 😊</>
        )}
      </motion.h2>

      {/* Trainer encouragement */}
      <TrainerEncouragement
        gameState={isCorrect ? 'RESULT_CORRECT' : 'RESULT_INCORRECT'}
        color={color}
      />

      {/* Show result based on correctness */}
      {isCorrect ? (
        <>
          {/* Correct: Show word prominently */}
          <div className="mt-4">
            <LetterRevealAnimation
              word={word}
              isCorrect={true}
              color={color}
            />
          </div>

          {/* Definition card */}
          {definition && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="card mt-4 max-w-md"
            >
              <p className="text-text-muted text-center">{definition}</p>
            </motion.div>
          )}
        </>
      ) : (
        <>
          {/* Incorrect: Show comparison */}
          <div className="mt-4 w-full">
            <LetterComparisonDisplay
              userSpelling={userSpelling}
              correctSpelling={word}
            />
          </div>

          {/* Encouraging message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-text-muted text-center max-w-sm"
          >
            Don't give up, Trainer! Every Pokemon Master started somewhere. Keep practicing!
          </motion.p>
        </>
      )}

      {/* Audio replay button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          variant="secondary"
          onClick={handlePlayWord}
        >
          🔊 Hear it again
        </Button>
      </motion.div>

      {/* Next word button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-4 flex flex-col items-center gap-2"
      >
        <Button
          variant="primary"
          size="lg"
          onClick={onNextWord}
        >
          ⚡ Next Word →
        </Button>

        {/* Voice command indicator */}
        {isListening && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-text-muted flex items-center gap-2"
          >
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            🎤 Say "next word" or click button
          </motion.p>
        )}
      </motion.div>

      {/* Confetti effect for correct answers */}
      {isCorrect && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.5;
            const duration = 2 + Math.random() * 2;

            return (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{ left: `${left}%`, top: '-50px' }}
                initial={{ y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  y: window.innerHeight + 100,
                  opacity: 0,
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                }}
                transition={{
                  duration,
                  delay,
                  ease: 'linear',
                }}
              >
                {['🎉', '✨', '⭐', '🎊'][i % 4]}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
