import { useState, useEffect, useRef } from 'react';
import { useSpelling } from '../../contexts/SpellingContext';
import { extractSpellingPattern } from '../../utils/patternExtractor';
import { useWhisperOnlyRecording } from '../../hooks/useWhisperOnlyRecording';
import { BigPokeballListening } from './pokemon/BigPokeballListening';
import { ThreePokeballProgress } from './pokemon/ThreePokeballProgress';
import { EeveeProcessing } from './pokemon/EeveeProcessing';
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

  // Whisper-only recording hook with 30s max time and 1.5s silence detection
  const {
    isRecording,
    isProcessing,
    error,
    currentStep,
    timeElapsed,
    timeRemaining,
    step1Complete,
    step2Complete,
    step3Complete,
    startRecording,
    cancelRecording,
  } = useWhisperOnlyRecording({
    recordingDuration: 30,
    silenceDuration: 1.5,
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

    // Check for critical issues that indicate user didn't spell it
    const criticalIssues = result.issues.filter(issue =>
      issue.includes('No letter sequence') ||
      issue.includes('First word not found') ||
      issue.includes('Second word not found')
    );

    console.log('[VoiceInputWhisper] Critical issues:', criticalIssues);

    // STRICT VALIDATION: Require valid pattern structure
    // Only accept if:
    // 1. Pattern is valid (word → letters → word structure found)
    // 2. No critical issues (letters were actually spelled out)
    // 3. Spelling was extracted
    let finalSpelling = '';

    if (result.isValid && criticalIssues.length === 0 && result.spelling && result.spelling.length > 0) {
      // Valid pattern found - user spelled it correctly
      finalSpelling = result.spelling.toLowerCase();
      console.log('[VoiceInputWhisper] ✅ Valid spelling pattern detected:', finalSpelling);
    } else {
      // Invalid pattern or critical issues - reject
      finalSpelling = '';
      console.log('[VoiceInputWhisper] ❌ Invalid pattern - rejecting attempt');
      console.log('[VoiceInputWhisper] Rejection reasons:', {
        isValid: result.isValid,
        hasCriticalIssues: criticalIssues.length > 0,
        hasSpelling: !!result.spelling,
        criticalIssues: criticalIssues,
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

  // Handle cancel
  const handleCancel = () => {
    cancelRecording();
    setPhase('RECORDING');
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
    <div className="card space-y-6">
      {/* Error State */}
      {error && (
        <div className="text-center p-6 bg-error/10 border-2 border-error rounded-lg">
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

      {/* Game Screen: Big pokeball on top + 3 pokeballs on bottom */}
      {!error && (isPronouncingWord || phase === 'RECORDING') && (
        <div className="space-y-6">
          {/* Big pokeball on top */}
          <BigPokeballListening
            gymColor={gymColor}
            message={isPronouncingWord
              ? "Listen carefully..."
              : "Speak now: Word → Spell it → Word again"
            }
            isRecording={phase === 'RECORDING' && !isPronouncingWord}
            timeRemaining={!isPronouncingWord && recordingStarted ? timeRemaining : undefined}
          />

          {/* 3 pokeballs on bottom - always shown */}
          <div className="space-y-4">
            <ThreePokeballProgress
              color={gymColor}
              currentStep={!isPronouncingWord && recordingStarted ? currentStep : 1}
              step1Complete={!isPronouncingWord && recordingStarted ? step1Complete : false}
              step2Complete={!isPronouncingWord && recordingStarted ? step2Complete : false}
              step3Complete={!isPronouncingWord && recordingStarted ? step3Complete : false}
              step1Text={null}
              step2Text={undefined}
              isSubmitting={false}
              timeRemaining={!isPronouncingWord && recordingStarted ? timeRemaining : undefined}
            />

            {/* Progress bar during recording only */}
            {phase === 'RECORDING' && !isPronouncingWord && (
              <>
                <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full transition-all duration-100"
                    style={{
                      width: `${(timeElapsed / 30) * 100}%`,
                      backgroundColor: gymColor,
                    }}
                  />
                </div>

                <p className="text-sm text-text-muted text-center">
                  Auto-submits after 1.5s silence
                </p>

                {/* Cancel button */}
                <div className="text-center">
                  <Button variant="error" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Phase: PROCESSING - Show Eevee processing animation */}
      {!error && phase === 'PROCESSING' && (
        <EeveeProcessing gymColor={gymColor} />
      )}
    </div>
  );
}
