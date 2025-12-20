import { useEffect, useCallback, useRef } from 'react';
import { Button } from '../common/Button';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { useSpelling } from '../../contexts/SpellingContext';
import { openAIService } from '../../services/api';
import { soundManager } from '../../services/sound';
import type { Word } from '../../types';

interface VoiceInputProps {
  autoStart?: boolean;
  currentWord?: Word;
}

export function VoiceInput({ autoStart = false, currentWord }: VoiceInputProps) {
  const {
    isRecording,
    isProcessing,
    error,
    timeRemaining,
    voiceDetected,
    startRecording,
    stopRecording,
    cancelRecording,
    setAutoStopCallback
  } = useVoiceRecording();

  const { currentAttempt, setCurrentAttempt, submitAttempt } = useSpelling();
  const hasAutoStarted = useRef(false);
  const shouldAutoSubmitRef = useRef(false);

  // Extract spelled letters from "word C-A-T word" format
  const extractSpelledLetters = (transcription: string): string => {
    console.log('[EXTRACT] Analyzing transcription for spelled letters...');

    // Split by common separators (spaces, hyphens, commas, etc.)
    const tokens = transcription
      .split(/[\s\-,._]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    console.log('[EXTRACT] Tokens:', tokens);

    // Find sequences of single-character tokens (these are the spelled letters)
    const spelledLetters: string[] = [];
    let inSpellingSequence = false;

    for (const token of tokens) {
      // Check if token is a single letter (A-Z or a-z)
      if (/^[a-zA-Z]$/.test(token)) {
        spelledLetters.push(token);
        inSpellingSequence = true;
      } else if (inSpellingSequence) {
        // If we were in a spelling sequence and hit a multi-char word, stop
        // This handles the case where kid says the word at the end
        break;
      }
      // If not in sequence yet and it's a multi-char word, skip it
      // This handles the case where kid says the word at the beginning
    }

    if (spelledLetters.length > 0) {
      const extracted = spelledLetters.join('').toLowerCase();
      console.log('[EXTRACT] Found spelled letters:', extracted);
      return extracted;
    }

    // Fallback: if no pattern detected, clean the entire transcription
    console.log('[EXTRACT] No spelling pattern detected, using fallback cleaning');
    return transcription
      .replace(/[\s\-_.,;:]/g, '')
      .trim()
      .toLowerCase();
  };

  // Handle auto-stop and auto-submit
  const handleAutoStop = useCallback(async () => {
    console.log('[AUTO-STOP] Triggered! Stopping recording...');
    try {
      const transcription = await stopRecording();
      console.log('[AUTO-STOP] Received transcription:', transcription);

      // If no transcription (empty or no voice detected), don't submit
      if (!transcription || transcription.trim() === '') {
        console.log('[AUTO-STOP] No voice detected, not submitting');
        return;
      }

      const lowerTranscription = transcription.toLowerCase();

      // Check for voice commands (definition or sentence request)
      const isDefinitionRequest = lowerTranscription.includes('definition');
      const isSentenceRequest = lowerTranscription.includes('sentence') ||
                                 lowerTranscription.includes('example') ||
                                 lowerTranscription.includes('use it');

      // Handle definition request
      if (isDefinitionRequest && currentWord?.definition) {
        console.log('[VOICE-CMD] Definition requested!');
        try {
          const text = `${currentWord.word}. ${currentWord.definition}`;
          const { audioUrl } = await openAIService.textToSpeech(text, 'nova', 1.0);
          await soundManager.playWord(audioUrl);
          console.log('[VOICE-CMD] Definition spoken, ready for spelling');
        } catch (error) {
          console.error('[VOICE-CMD] Error speaking definition:', error);
        }
        // Restart recording for spelling
        startRecording();
        return;
      }

      // Handle sentence request
      if (isSentenceRequest && currentWord?.sentence) {
        console.log('[VOICE-CMD] Sentence requested!');
        try {
          const { audioUrl } = await openAIService.textToSpeech(currentWord.sentence, 'nova', 1.0);
          await soundManager.playWord(audioUrl);
          console.log('[VOICE-CMD] Sentence spoken, ready for spelling');
        } catch (error) {
          console.error('[VOICE-CMD] Error speaking sentence:', error);
        }
        // Restart recording for spelling
        startRecording();
        return;
      }

      // Not a command, proceed with spelling extraction
      console.log('[AUTO-STOP] Extracting spelled letters...');
      console.log('  Original:', `"${transcription}"`);

      const cleaned = extractSpelledLetters(transcription);

      console.log('  Extracted:', `"${cleaned}"`, '(length:', cleaned.length, ')');
      console.log('  Cleaned bytes:', Array.from(cleaned).map(c => c.charCodeAt(0)));

      // Set the flag to trigger auto-submit after state updates
      shouldAutoSubmitRef.current = true;
      setCurrentAttempt(cleaned);
    } catch (error) {
      console.error('[AUTO-STOP] Error:', error);
    }
  }, [stopRecording, setCurrentAttempt, currentWord, startRecording]);

  // Register the auto-stop callback
  useEffect(() => {
    setAutoStopCallback(handleAutoStop);
  }, [setAutoStopCallback, handleAutoStop]);

  // Auto-submit when currentAttempt is updated after recording
  useEffect(() => {
    if (shouldAutoSubmitRef.current && currentAttempt) {
      console.log('[AUTO-SUBMIT] State updated, submitting after 500ms delay...');
      console.log('[AUTO-SUBMIT] Current attempt value:', `"${currentAttempt}"`);

      // Reset the flag
      shouldAutoSubmitRef.current = false;

      // Auto-submit after a brief delay (500ms) to show the user what was transcribed
      const timeoutId = setTimeout(() => {
        console.log('[AUTO-SUBMIT] Submitting attempt now...');
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

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleCancel = () => {
    cancelRecording();
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-4">
          {isRecording
            ? (voiceDetected
                ? 'Recording... Keep going!'
                : 'Waiting for you to speak...')
            : isProcessing
              ? 'Processing...'
              : 'Ready when you are!'}
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border-2 border-error rounded-lg">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col items-center justify-center mb-4">
          {!isRecording && !isProcessing && (
            <Button variant="primary" size="lg" onClick={handleStartRecording}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎤</span>
                <span>Start Recording</span>
              </div>
            </Button>
          )}

          {isRecording && (
            <div className="space-y-4">
              {/* Countdown Timer */}
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <div className="flex justify-center items-center gap-2 mb-4">
                  <div className="flex gap-1">
                    <span className={`inline-block w-3 h-3 rounded-full animate-pulse ${voiceDetected ? 'bg-success' : 'bg-warning'}`}></span>
                    <span className={`inline-block w-3 h-3 rounded-full animate-pulse delay-75 ${voiceDetected ? 'bg-success' : 'bg-warning'}`}></span>
                    <span className={`inline-block w-3 h-3 rounded-full animate-pulse delay-150 ${voiceDetected ? 'bg-success' : 'bg-warning'}`}></span>
                  </div>
                  <span className="text-text-muted font-semibold">
                    {voiceDetected ? 'Listening...' : 'Waiting for voice...'}
                  </span>
                </div>
              </div>

              {/* Visual audio indicator */}
              <div className="flex justify-center items-center gap-1 h-16">
                <div className={`w-2 rounded-full animate-pulse ${voiceDetected ? 'bg-success' : 'bg-warning'}`} style={{ height: '30%' }}></div>
                <div className={`w-2 rounded-full animate-pulse delay-75 ${voiceDetected ? 'bg-success' : 'bg-warning'}`} style={{ height: '50%' }}></div>
                <div className={`w-2 rounded-full animate-pulse delay-150 ${voiceDetected ? 'bg-success' : 'bg-warning'}`} style={{ height: '70%' }}></div>
                <div className={`w-2 rounded-full animate-pulse ${voiceDetected ? 'bg-success' : 'bg-warning'}`} style={{ height: '90%' }}></div>
                <div className={`w-2 rounded-full animate-pulse delay-75 ${voiceDetected ? 'bg-success' : 'bg-warning'}`} style={{ height: '70%' }}></div>
                <div className={`w-2 rounded-full animate-pulse delay-150 ${voiceDetected ? 'bg-success' : 'bg-warning'}`} style={{ height: '50%' }}></div>
                <div className={`w-2 rounded-full animate-pulse ${voiceDetected ? 'bg-success' : 'bg-warning'}`} style={{ height: '30%' }}></div>
              </div>

              {/* Status message */}
              {!voiceDetected && (
                <div className="text-sm text-warning font-semibold animate-pulse">
                  💬 Say the word, spell it, then say it again!
                </div>
              )}

              {voiceDetected && (
                <div className="text-sm text-success font-semibold animate-pulse">
                  ✅ Voice detected! Say word → spell → say word, then pause 2 seconds
                </div>
              )}

              {/* Cancel button */}
              <Button variant="error" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-6xl animate-spin">⚙️</div>
              <p className="text-xl font-semibold text-text-muted">Processing your answer...</p>
              <div className="text-sm text-text-muted">
                This will only take a moment!
              </div>
            </div>
          )}
        </div>

        {!isRecording && !isProcessing && (
          <div className="text-sm text-text-muted space-y-2 mt-4">
            <p className="font-semibold">📢 How it works:</p>
            <p>1. Listen to the word (automatic)</p>
            <p>2. Recording starts automatically</p>
            <p>3. Say the word first: "cat"</p>
            <p>4. Spell each letter: "C - A - T"</p>
            <p>5. Say the word again: "cat"</p>
            <p>6. Wait 2 seconds of silence</p>
            <p>7. Your answer will auto-submit! ✨</p>
          </div>
        )}
      </div>
    </div>
  );
}
