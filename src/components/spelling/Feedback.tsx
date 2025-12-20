import { useEffect, useState, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '../common/Button';
import { useSpelling } from '../../contexts/SpellingContext';
import { soundManager } from '../../services/sound';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';

export function Feedback() {
  const { isCorrect, currentWord, currentAttempt, nextWord } = useSpelling();
  const [isListeningForCommand, setIsListeningForCommand] = useState(false);
  const hasStartedListeningRef = useRef(false);

  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    setAutoStopCallback
  } = useVoiceRecording();

  // Handle voice command auto-stop
  const handleCommandAutoStop = useCallback(async () => {
    console.log('[VOICE-CMD] Auto-stop triggered, processing command...');
    try {
      const transcription = await stopRecording();
      console.log('[VOICE-CMD] Received:', transcription);

      if (!transcription || transcription.trim() === '') {
        console.log('[VOICE-CMD] No command detected, still waiting...');
        setIsListeningForCommand(false);
        return;
      }

      // Normalize transcription
      const command = transcription.trim().toLowerCase();
      console.log('[VOICE-CMD] Normalized:', command);

      // Check if it matches any of the next word commands
      const nextWordCommands = ['next word', 'next', 'continue', 'go'];
      const isNextCommand = nextWordCommands.some(cmd => command.includes(cmd));

      if (isNextCommand) {
        console.log('[VOICE-CMD] ✅ Next word command detected! Moving to next word...');
        setIsListeningForCommand(false);
        nextWord();
      } else {
        console.log('[VOICE-CMD] ❌ Command not recognized, still waiting...');
        setIsListeningForCommand(false);
      }
    } catch (error) {
      console.error('[VOICE-CMD] Error processing command:', error);
      setIsListeningForCommand(false);
    }
  }, [stopRecording, nextWord]);

  // Register the command auto-stop callback
  useEffect(() => {
    setAutoStopCallback(handleCommandAutoStop);
  }, [setAutoStopCallback, handleCommandAutoStop]);

  // Play sound effects and trigger confetti
  useEffect(() => {
    if (isCorrect === null) return;

    // Play sound effect
    if (isCorrect) {
      soundManager.playEffect('correct').catch(console.error);
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      soundManager.playEffect('incorrect').catch(console.error);
    }
  }, [isCorrect]);

  // Auto-start voice command listening when feedback appears
  useEffect(() => {
    if (isCorrect !== null && !hasStartedListeningRef.current && !isRecording) {
      console.log('[VOICE-CMD] Feedback shown, starting voice command listening...');
      hasStartedListeningRef.current = true;
      setIsListeningForCommand(true);

      // Small delay to let feedback show before starting recording
      setTimeout(() => {
        startRecording();
      }, 1000);
    }

    // Reset when feedback is cleared
    if (isCorrect === null) {
      hasStartedListeningRef.current = false;
      setIsListeningForCommand(false);
    }
  }, [isCorrect, isRecording, startRecording]);

  if (isCorrect === null || !currentWord) return null;

  return (
    <div className={`card ${isCorrect ? 'bg-success/10 border-2 border-success' : 'bg-error/10 border-2 border-error'}`}>
      <div className="text-center space-y-4">
        <div className="text-8xl">
          {isCorrect ? '🎉' : '😊'}
        </div>

        <h2 className={`text-3xl font-bold ${isCorrect ? 'text-success' : 'text-error'}`}>
          {isCorrect ? 'Correct!' : 'Not quite!'}
        </h2>

        {!isCorrect && (
          <div className="space-y-2">
            <p className="text-lg">
              <span className="font-semibold">You spelled:</span>{' '}
              <span className="text-error font-bold">{currentAttempt}</span>
            </p>
            <p className="text-lg">
              <span className="font-semibold">Correct spelling:</span>{' '}
              <span className="text-success font-bold">{currentWord.word}</span>
            </p>
            <p className="text-sm text-text-muted mt-4">
              Don't worry! You'll get it next time. 💪
            </p>
          </div>
        )}

        {isCorrect && (
          <div className="space-y-2">
            <p className="text-2xl font-bold text-success">{currentWord.word}</p>
            <p className="text-lg">
              Great job! You spelled it perfectly! 🌟
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button variant="primary" size="lg" onClick={nextWord}>
            Next Word →
          </Button>

          {/* Voice command indicator */}
          {isListeningForCommand && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary animate-pulse">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping"></span>
              <span className="font-semibold">🎤 Say "next word" or click button</span>
            </div>
          )}

          {!isListeningForCommand && !isRecording && !isProcessing && (
            <div className="text-xs text-text-muted">
              💡 Tip: You can say "next word" to continue!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
