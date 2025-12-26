import { useState, useEffect, useRef } from 'react';
import { useSpelling } from '../../contexts/SpellingContext';
import { useGym } from '../../contexts/GymContext';
import { extractSpellingPattern } from '../../utils/patternExtractor';
import { useWhisperOnlyRecording } from '../../hooks/useWhisperOnlyRecording';
import { BigPokeballListening } from './pokemon/BigPokeballListening';
import { PokemonCoach } from './pokemon/PokemonCoach';
import { Button } from '../common/Button';
import type { Word } from '../../types';

interface VoiceInputWhisperOnlyProps {
  currentWord: Word;
  gymColor: string;
  isPronouncingWord: boolean;
}

type GamePhase = 'RECORDING' | 'PROCESSING';

/**
 * Voice Input with Whisper-Only Recognition
 *
 * Flow:
 * 1. RECORDING: Shows 3 pokeballs lighting up based on time (30 seconds total)
 * 2. PROCESSING: Sends audio to Whisper for transcription and extraction
 *
 * NOTE: Pronunciation is handled by parent component
 * NO real-time speech recognition - only Whisper API at the end
 * Recording starts immediately when component mounts (no countdown)
 */
export function VoiceInputWhisperOnly({
  currentWord,
  gymColor,
  isPronouncingWord,
}: VoiceInputWhisperOnlyProps) {
  const [phase, setPhase] = useState<GamePhase>('RECORDING');
  const [recordingStarted, setRecordingStarted] = useState(false);
  const { setCurrentAttempt, submitAttempt } = useSpelling();
  const { selectedGym } = useGym();
  const spellingToSubmitRef = useRef<string>('');

  // Reset recording state when word changes
  useEffect(() => {
    console.log('[VoiceInputWhisper] ━━━ WORD CHANGE DETECTED ━━━');
    console.log('[VoiceInputWhisper] New word:', currentWord.word);
    console.log('[VoiceInputWhisper] Resetting recordingStarted to false');
    setRecordingStarted(false);
    setPhase('RECORDING');
  }, [currentWord.id]);

  // Start recording ONLY when pronunciation completes
  useEffect(() => {
    console.log('[VoiceInputWhisper] ━━━ RECORDING CHECK EFFECT ━━━');
    console.log('[VoiceInputWhisper] isPronouncingWord:', isPronouncingWord);
    console.log('[VoiceInputWhisper] recordingStarted:', recordingStarted);
    console.log('[VoiceInputWhisper] Condition (!isPronouncingWord && !recordingStarted):', !isPronouncingWord && !recordingStarted);

    if (!isPronouncingWord && !recordingStarted) {
      console.log('[VoiceInputWhisper] ✅ CONDITION MET - Will start recording in 200ms');
      const timer = setTimeout(() => {
        console.log('[VoiceInputWhisper] 🎙️ RECORDING STARTING NOW!');
        setRecordingStarted(true);
        startRecording();
      }, 200);
      return () => clearTimeout(timer);
    }

    if (isPronouncingWord) {
      console.log('[VoiceInputWhisper] 🔊 Still waiting - pronunciation in progress...');
    } else if (recordingStarted) {
      console.log('[VoiceInputWhisper] ⏺️ Recording already started - doing nothing');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPronouncingWord, recordingStarted]);

  // Whisper-only recording hook with 30s max time and 5s silence detection
  const {
    isRecording,
    isProcessing,
    error,
    timeElapsed,
    timeRemaining,
    startRecording,
    stopRecording,
  } = useWhisperOnlyRecording({
    recordingDuration: 30,
    silenceDuration: 5.0, // 5 seconds - gives kids time to pause between letters (especially for long words)
    onComplete: handleRecordingComplete,
  });

  // Handle recording complete - process with Whisper
  function handleRecordingComplete(transcription: string, audioBlob?: Blob, error?: Error) {
    console.log('[VoiceInputWhisper] Recording complete, processing...');
    console.log('[VoiceInputWhisper] Transcription:', transcription);
    console.log('[VoiceInputWhisper] Audio blob:', audioBlob?.size);
    console.log('[VoiceInputWhisper] Error:', error);
    console.log('[VoiceInputWhisper] Expected word:', currentWord.word);
    setPhase('PROCESSING');

    // Handle errors gracefully - treat as incorrect attempt
    if (error || !transcription || transcription.trim() === '') {
      console.log('[VoiceInputWhisper] No valid transcription, treating as incorrect');
      // Submit empty string as incorrect attempt
      setCurrentAttempt('');
      submitAttempt('');
      return;
    }

    // Extract spelling using robust pattern extraction
    const result = extractSpellingPattern(transcription, currentWord.word);

    console.log('[VoiceInputWhisper] Pattern extraction result:', {
      spelling: result.spelling,
      confidence: result.confidence,
      isValid: result.isValid,
      issues: result.issues,
      structure: result.structure,
    });

    // Check if spelling was extracted successfully
    const hasSpelling = result.spelling && result.spelling.length > 0;
    const spellingMatchesWord = hasSpelling &&
      result.spelling.toLowerCase() === currentWord.word.toLowerCase();

    // Check for critical issues (only "no letters" is truly critical)
    const hasNoLetters = result.issues.some(issue =>
      issue.includes('No letter sequence') ||
      issue.includes('No letters found')
    );

    console.log('[VoiceInputWhisper] Validation check:', {
      hasSpelling,
      spellingMatchesWord,
      hasNoLetters,
      extractedSpelling: result.spelling,
      expectedWord: currentWord.word,
    });

    // LENIENT VALIDATION: Accept if letters spell the correct word
    // Even if the anchor words (beginning/end) didn't match perfectly
    // What matters is: Did they spell the letters correctly?
    let finalSpelling = '';

    if (spellingMatchesWord) {
      // Spelling matches the expected word - accept it!
      finalSpelling = result.spelling.toLowerCase();
      console.log('[VoiceInputWhisper] ✅ Correct spelling detected:', finalSpelling);
    } else if (hasSpelling && !hasNoLetters) {
      // Has spelling but doesn't match - accept as incorrect attempt
      finalSpelling = result.spelling.toLowerCase();
      console.log('[VoiceInputWhisper] ⚠️ Incorrect spelling detected:', finalSpelling);
    } else {
      // No valid spelling extracted - reject
      finalSpelling = '';
      console.log('[VoiceInputWhisper] ❌ No valid spelling - rejecting attempt');
      console.log('[VoiceInputWhisper] Rejection reasons:', {
        hasSpelling,
        hasNoLetters,
        issues: result.issues,
      });
    }

    // Log all issues for debugging
    if (result.issues.length > 0) {
      console.warn('[VoiceInputWhisper] All pattern issues:', result.issues);
    }

    console.log('[VoiceInputWhisper] Final spelling to submit:', finalSpelling, 'Length:', finalSpelling.length);

    // Always submit (even if empty - will be marked as incorrect)
    // Store in ref to prevent loss during re-renders
    spellingToSubmitRef.current = finalSpelling;
    console.log('[VoiceInputWhisper] Stored spelling in ref:', spellingToSubmitRef.current);

    // Set the attempt for display/state
    setCurrentAttempt(finalSpelling);
    console.log('[VoiceInputWhisper] Set currentAttempt to:', finalSpelling);

    // Submit immediately with the spelling as parameter to avoid state timing issues
    console.log('[VoiceInputWhisper] Calling submitAttempt() with spelling:', finalSpelling);
    submitAttempt(finalSpelling);
  }

  // Handle manual submit - user clicks Submit button to process recording immediately
  const handleManualSubmit = () => {
    console.log('[VoiceInputWhisper] Manual submit clicked - stopping recording');
    stopRecording();
  };

  // Update phase based on recording state
  useEffect(() => {
    if (isProcessing) {
      setPhase('PROCESSING');
    } else if (isRecording) {
      setPhase('RECORDING');
    }
  }, [isRecording, isProcessing]);

  // Unified screen showing all phases
  return (
    <div className="card space-y-3">
      {/* Error State */}
      {error && (
        <div className="text-center p-4 bg-error/10 border-2 border-error rounded-lg">
          <p className="text-lg font-semibold text-error mb-2">⚠️ Recording Error</p>
          <p className="text-sm text-text-muted">{error}</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setPhase('RECORDING');
              setRecordingStarted(false);
              setTimeout(() => {
                setRecordingStarted(true);
                startRecording();
              }, 100);
            }}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Game Screen: Big pokeball on top + Pokemon Coach below */}
      {!error && (isPronouncingWord || phase === 'RECORDING') && (
        <div className="space-y-3">
          {/* Big pokeball on top */}
          <BigPokeballListening
            gymColor={gymColor}
            gymType={selectedGym?.name}
            message={isPronouncingWord
              ? "Listen carefully..."
              : "Speak now: Word → Spell it → Word again"
            }
            isRecording={phase === 'RECORDING' && !isPronouncingWord}
            timeRemaining={!isPronouncingWord && recordingStarted ? timeRemaining : undefined}
          />

          {/* Pokemon Coach - animated character below pokeball */}
          <PokemonCoach
            phase={isPronouncingWord ? 'listening' : 'recording'}
            gymColor={gymColor}
            gymType={selectedGym?.name}
          />

          {/* Progress bar and controls during recording only */}
          {phase === 'RECORDING' && !isPronouncingWord && (
            <div className="space-y-3">
              <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                <div
                  className="h-full transition-all duration-100"
                  style={{
                    width: `${(timeElapsed / 30) * 100}%`,
                    backgroundColor: gymColor,
                  }}
                />
              </div>

              <p className="text-xs text-text-muted text-center">
                Auto-submits after 5s silence
              </p>

              {/* Submit button - always visible, allows manual submit */}
              <div className="text-center">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleManualSubmit}
                  style={{ backgroundColor: gymColor }}
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phase: PROCESSING - Show Pokemon Coach thinking */}
      {!error && phase === 'PROCESSING' && (
        <div className="space-y-3">
          <PokemonCoach
            phase="processing"
            gymColor={gymColor}
            gymType={selectedGym?.name}
          />
        </div>
      )}
    </div>
  );
}
