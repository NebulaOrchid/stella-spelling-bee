import { useState, useRef, useCallback, useEffect } from 'react';
import { openAIService } from '../services/api';

interface UseWhisperOnlyRecordingOptions {
  onComplete?: (transcription: string, audioBlob?: Blob, error?: Error) => void;
  recordingDuration?: number; // Maximum recording time in seconds
  silenceDuration?: number; // Auto-submit after this many seconds of silence
}

/**
 * Whisper-Only Recording Hook
 *
 * Records audio using MediaRecorder and sends to Whisper for transcription.
 * NO real-time speech recognition - just time-based progress tracking.
 * Auto-submits after detecting silence for specified duration.
 *
 * Progress phases (30 seconds max):
 * - Step 1 (0-3s): User says the word
 * - Step 2 (3-25s): User spells letter by letter
 * - Step 3 (25-30s): User says the word again
 */
export function useWhisperOnlyRecording({
  onComplete,
  recordingDuration = 30,
  silenceDuration = 1.5,
}: UseWhisperOnlyRecordingOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(recordingDuration);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const voiceDetectedRef = useRef<boolean>(false);

  // Sustained voice tracking - prevents brief noises from triggering auto-submit
  const voiceSustainedStartRef = useRef<number | null>(null);
  const voiceSustainedConfirmedRef = useRef<boolean>(false);

  // Voice activity detection thresholds
  const VOICE_THRESHOLD = -40; // dB
  const SILENCE_THRESHOLD = -42; // dB
  const MIN_SUSTAINED_VOICE_DURATION = 1500; // 1.5 seconds of continuous speech required

  // Step progression based on time intervals (all 3 pokeballs light up in 10 seconds)
  // Recording still runs for 30 seconds max, but pokeball animation completes faster
  // Step 1: 0-3 seconds (say word)
  // Step 2: 3-7 seconds (spell letters)
  // Step 3: 7-10 seconds (say word again)
  const getStepFromTime = (elapsed: number): 1 | 2 | 3 => {
    if (elapsed < 3) return 1;
    if (elapsed < 7) return 2;
    return 3;
  };

  // Calculate completion for each step based on time
  const getStepCompletion = (step: 1 | 2 | 3, elapsed: number) => {
    if (step === 1) return elapsed >= 3;
    if (step === 2) return elapsed >= 7;
    if (step === 3) return elapsed >= 10;
    return false;
  };

  // Voice Activity Detection - Calculate audio level in dB
  const getAudioLevel = useCallback(() => {
    if (!analyserRef.current) return -Infinity;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average frequency power
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

    // Convert to dB scale
    const dB = 20 * Math.log10(average / 255);
    return dB;
  }, []);

  // Check for silence and auto-submit if detected
  // REQUIRES SUSTAINED VOICE (1.5s) before enabling silence detection
  const checkForSilence = useCallback(() => {
    const dB = getAudioLevel();
    const now = Date.now();

    // Voice detected (loud enough)
    if (dB > VOICE_THRESHOLD) {
      // Start tracking sustained voice
      if (voiceSustainedStartRef.current === null) {
        voiceSustainedStartRef.current = now;
        console.log('[VAD] Voice detected, tracking duration...');
      } else {
        // Check if voice has been sustained long enough
        const voiceDuration = now - voiceSustainedStartRef.current;
        if (voiceDuration >= MIN_SUSTAINED_VOICE_DURATION && !voiceSustainedConfirmedRef.current) {
          voiceSustainedConfirmedRef.current = true;
          voiceDetectedRef.current = true;
          console.log(`[VAD] ✅ SUSTAINED VOICE CONFIRMED after ${voiceDuration}ms`);
        }
      }

      silenceStartRef.current = null; // Reset silence timer
      return;
    }

    // Not voice - reset sustained tracking
    voiceSustainedStartRef.current = null;

    // ONLY track silence if sustained voice was confirmed
    if (dB < SILENCE_THRESHOLD && voiceSustainedConfirmedRef.current) {
      // Start tracking silence
      if (silenceStartRef.current === null) {
        silenceStartRef.current = now;
        console.log('[VAD] Silence detected after sustained voice, starting timer');
      }

      // Check if silence duration exceeded
      const silenceElapsed = (now - silenceStartRef.current) / 1000;
      if (silenceElapsed >= silenceDuration) {
        console.log(`[VAD] Auto-submitting after ${silenceDuration}s silence (sustained voice was confirmed)`);
        stopRecording();
      }
    } else {
      // Not silent enough, or sustained voice not confirmed - reset
      silenceStartRef.current = null;
    }
  }, [getAudioLevel, silenceDuration]);

  const startRecording = useCallback(async () => {
    try {
      console.log('[WhisperOnly] ╔════════════════════════════════════╗');
      console.log('[WhisperOnly] ║ RECORDING FUNCTION CALLED          ║');
      console.log('[WhisperOnly] ║ Setting up 30s countdown...        ║');
      console.log('[WhisperOnly] ╚════════════════════════════════════╝');
      setError(null);
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      silenceStartRef.current = null;
      voiceDetectedRef.current = false;

      // Reset sustained voice tracking
      voiceSustainedStartRef.current = null;
      voiceSustainedConfirmedRef.current = false;

      setTimeElapsed(0);
      setTimeRemaining(recordingDuration);
      setCurrentStep(1);
      console.log('[WhisperOnly] State reset complete - timeRemaining set to', recordingDuration);
      console.log('[WhisperOnly] Sustained voice tracking initialized (requires 1.5s continuous speech)');

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup AudioContext for Voice Activity Detection
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      console.log('[WhisperOnly] VAD initialized');

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('[WhisperOnly] Recording stopped, processing...');

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Clear timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        // Create audio blob
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('[WhisperOnly] Audio blob size:', audioBlob.size);

        if (audioBlob.size === 0) {
          console.log('[WhisperOnly] No audio recorded, treating as incorrect');
          setIsRecording(false);
          setIsProcessing(false);
          // Call onComplete with empty transcription (will be treated as incorrect)
          if (onComplete) {
            onComplete('', audioBlob, new Error('No audio recorded'));
          }
          return;
        }

        // Send to Whisper
        try {
          setIsProcessing(true);
          console.log('[WhisperOnly] Sending to Whisper...');
          const response = await openAIService.speechToText(audioBlob);
          console.log('[WhisperOnly] Whisper transcription:', response.text);

          if (onComplete) {
            onComplete(response.text, audioBlob);
          }
        } catch (err) {
          console.error('[WhisperOnly] Error transcribing:', err);
          const error = err instanceof Error ? err : new Error('Failed to transcribe audio');
          // Pass error to callback instead of showing error state
          // This allows the component to handle it gracefully
          if (onComplete) {
            onComplete('', audioBlob, error);
          }
        } finally {
          setIsProcessing(false);
          setIsRecording(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      console.log('[WhisperOnly] Recording started');

      // Start timer for progress tracking
      timerIntervalRef.current = setInterval(() => {
        if (!startTimeRef.current) return;

        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(0, recordingDuration - elapsed);

        setTimeElapsed(elapsed);
        setTimeRemaining(remaining);
        setCurrentStep(getStepFromTime(elapsed));

        // Auto-stop when time runs out
        if (elapsed >= recordingDuration) {
          console.log('[WhisperOnly] Recording time limit reached, stopping...');
          stopRecording();
        }
      }, 100); // Update every 100ms for smooth progress

      // Start VAD checking for silence detection
      vadIntervalRef.current = setInterval(() => {
        checkForSilence();
      }, 100); // Check every 100ms

    } catch (err) {
      console.error('[WhisperOnly] Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsRecording(false);
    }
  }, [recordingDuration, onComplete]);

  const stopRecording = useCallback(() => {
    console.log('[WhisperOnly] Stopping recording...');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const cancelRecording = useCallback(() => {
    console.log('[WhisperOnly] Cancelling recording...');

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    chunksRef.current = [];

    // Reset sustained voice tracking
    voiceSustainedStartRef.current = null;
    voiceSustainedConfirmedRef.current = false;

    setIsRecording(false);
    setIsProcessing(false);
    setError(null);
    setTimeElapsed(0);
    setTimeRemaining(recordingDuration);
    setCurrentStep(1);
  }, [recordingDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[WhisperOnly] Cleanup on unmount');

      // Clear timers
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (vadIntervalRef.current) {
        clearInterval(vadIntervalRef.current);
        vadIntervalRef.current = null;
      }

      // Stop MediaRecorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn('[WhisperOnly] Error stopping MediaRecorder:', e);
        }
        mediaRecorderRef.current = null;
      }

      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('[WhisperOnly] Error stopping track:', e);
          }
        });
        streamRef.current = null;
      }

      // Close AudioContext (check state first to avoid double-close)
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) {
          console.warn('[WhisperOnly] Error closing AudioContext:', e);
        }
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    isRecording,
    isProcessing,
    error,
    currentStep,
    timeElapsed,
    timeRemaining,
    step1Complete: getStepCompletion(1, timeElapsed),
    step2Complete: getStepCompletion(2, timeElapsed),
    step3Complete: getStepCompletion(3, timeElapsed),
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
