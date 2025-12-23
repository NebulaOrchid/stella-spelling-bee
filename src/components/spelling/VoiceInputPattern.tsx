import { useEffect, useCallback, useRef } from 'react';
import { Button } from '../common/Button';
import { usePatternVoiceRecording } from '../../hooks/usePatternVoiceRecording';
import { ThreePokeballProgress } from './pokemon/ThreePokeballProgress';
import { useSpelling } from '../../contexts/SpellingContext';
import { openAIService } from '../../services/api';
import { extractSpellingPattern } from '../../utils/patternExtractor';
import type { Word } from '../../types';

interface VoiceInputPatternProps {
  autoStart?: boolean;
  currentWord?: Word;
  gymColor?: string;
}

/**
 * Pattern-based voice input with real-time guidance
 * Uses Web Speech API for pattern detection + MediaRecorder + Whisper for accuracy
 */
export function VoiceInputPattern({ autoStart = false, currentWord, gymColor }: VoiceInputPatternProps) {
  const {
    isRecording,
    isProcessing,
    error,
    patternState,
    detectedFirstWord,
    detectedLetters,
    detectedSecondWord,
    timeRemaining,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    setAutoSubmitCallback,
  } = usePatternVoiceRecording(currentWord?.word || '');

  const { currentAttempt, setCurrentAttempt, submitAttempt } = useSpelling();
  const hasAutoStarted = useRef(false);
  const shouldAutoSubmitRef = useRef(false);

  // Extract spelled letters from Whisper transcription using robust pattern extraction
  const extractSpelledLetters = (transcription: string): string => {
    console.log('[EXTRACT] Analyzing Whisper transcription:', transcription);

    if (!currentWord) {
      return transcription.replace(/[\s\-_.,;:]/g, '').trim().toLowerCase();
    }

    // Use robust pattern extraction with 3-anchor approach
    const result = extractSpellingPattern(transcription, currentWord.word);

    console.log('[EXTRACT] Pattern result:', {
      spelling: result.spelling,
      confidence: result.confidence,
      isValid: result.isValid,
      issues: result.issues,
      structure: result.structure
    });

    // Check confidence threshold
    if (result.isValid && result.confidence >= 60) {
      console.log('[EXTRACT] High confidence pattern detected:', result.spelling);
      return result.spelling.toLowerCase();
    }

    // Log issues for debugging
    if (result.issues.length > 0) {
      console.warn('[EXTRACT] Pattern issues:', result.issues);
    }

    // Fallback to simple extraction for low confidence
    if (result.confidence < 60 && result.spelling) {
      console.log('[EXTRACT] Low confidence, but using extracted spelling:', result.spelling);
      return result.spelling.toLowerCase();
    }

    // Final fallback: remove all non-alphabetic characters
    console.log('[EXTRACT] Using final fallback - removing all non-alphabetic characters');
    return transcription.replace(/[\s\-_.,;:]/g, '').trim().toLowerCase();
  };

  // Handle pattern completion and submit
  const handlePatternComplete = useCallback(async () => {
    console.log('[PATTERN] Pattern complete, stopping recording and transcribing...');

    try {
      // Stop recording and get audio blob
      const audioBlob = await stopRecording();

      // Send to Whisper for accurate transcription
      console.log('[PATTERN] Sending to Whisper for verification...');
      const whisperResponse = await openAIService.speechToText(audioBlob);
      const transcription = whisperResponse.text;
      console.log('[PATTERN] Whisper transcription:', transcription);

      if (!transcription || transcription.trim() === '') {
        console.log('[PATTERN] No transcription received, not submitting');
        return;
      }

      // Extract spelled letters from Whisper's accurate transcription
      const cleaned = extractSpelledLetters(transcription);

      console.log('[PATTERN] Extracted spelling:', cleaned);

      // Set the flag to trigger auto-submit
      shouldAutoSubmitRef.current = true;
      setCurrentAttempt(cleaned);
    } catch (error) {
      console.error('[PATTERN] Error processing:', error);
    }
  }, [stopRecording, setCurrentAttempt]);

  // Register the pattern complete callback
  useEffect(() => {
    setAutoSubmitCallback(handlePatternComplete);
  }, [setAutoSubmitCallback, handlePatternComplete]);

  // Auto-submit when currentAttempt is updated
  useEffect(() => {
    if (shouldAutoSubmitRef.current && currentAttempt) {
      console.log('[PATTERN] Submitting attempt:', currentAttempt);
      shouldAutoSubmitRef.current = false;

      const timeoutId = setTimeout(() => {
        submitAttempt();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [currentAttempt, submitAttempt]);

  // Auto-start recording when autoStart prop becomes true
  useEffect(() => {
    if (autoStart && !hasAutoStarted.current && !isRecording && !isProcessing) {
      hasAutoStarted.current = true;
      startRecording();
    }
  }, [autoStart, isRecording, isProcessing, startRecording]);

  // Reset hasAutoStarted when word changes
  useEffect(() => {
    hasAutoStarted.current = false;
  }, [currentWord?.id]);

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleCancel = () => {
    cancelRecording();
  };

  // If Web Speech API not supported, show message
  if (!isSupported) {
    return (
      <div className="card space-y-4">
        <div className="text-center p-6 bg-warning/10 border-2 border-warning rounded-lg">
          <p className="text-lg font-semibold mb-2">⚠️ Pattern Detection Not Available</p>
          <p className="text-sm text-text-muted">
            Your browser doesn't support real-time pattern detection.
            Please use Chrome, Edge, or Safari for the best experience.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-4">
          {isRecording
            ? 'Follow the steps below 👇'
            : isProcessing
            ? 'Processing...'
            : 'Ready to spell!'}
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border-2 border-error rounded-lg">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        {/* Start button */}
        {!isRecording && !isProcessing && (
          <div className="mb-6">
            <Button variant="primary" size="lg" onClick={handleStartRecording}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎤</span>
                <span>Start Recording</span>
              </div>
            </Button>
          </div>
        )}

        {/* Pokeball pattern guide (shown during recording) */}
        {isRecording && currentWord && (
          <ThreePokeballProgress
            color={gymColor || '#3b82f6'}
            currentStep={
              patternState === 'WAITING_FOR_FIRST_WORD' ? 1 :
              patternState === 'WAITING_FOR_SPELLING' ? 2 :
              patternState === 'WAITING_FOR_SECOND_WORD' ? 3 : 3
            }
            step1Complete={detectedFirstWord !== null}
            step2Complete={detectedLetters.length >= Math.floor((currentWord.word.length / 2))}
            step3Complete={detectedSecondWord !== null}
            step1Text={detectedFirstWord}
            step2Text={detectedLetters.length > 0 ? detectedLetters.join('-').toUpperCase() : undefined}
            isSubmitting={patternState === 'SUBMITTING'}
            timeRemaining={timeRemaining}
          />
        )}

        {/* Cancel button */}
        {isRecording && (
          <div className="mt-4">
            <Button variant="error" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl animate-spin">⚙️</div>
            <p className="text-xl font-semibold text-text-muted">
              Checking your answer with AI...
            </p>
          </div>
        )}

        {/* Instructions (shown when not recording) */}
        {!isRecording && !isProcessing && (
          <div className="text-sm text-text-muted space-y-2 mt-6 text-left max-w-md mx-auto">
            <p className="font-semibold text-center mb-3">📢 How it works:</p>
            <div className="space-y-1">
              <p>1. Listen to the word (plays automatically)</p>
              <p>2. Recording starts automatically</p>
              <p>3. Follow the visual steps:</p>
              <p className="ml-6">→ Say the word</p>
              <p className="ml-6">→ Spell it letter by letter</p>
              <p className="ml-6">→ Say the word again</p>
              <p>4. Your answer submits automatically! ✨</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
