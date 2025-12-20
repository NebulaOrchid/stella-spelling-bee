import { useState, useRef, useCallback, useEffect } from 'react';
import { openAIService } from '../services/api';

export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  timeRemaining: number; // Countdown timer in seconds
  voiceDetected: boolean; // Whether user has started speaking
}

const MAX_RECORDING_TIME = 60; // 60 seconds max
const SILENCE_THRESHOLD = -42; // dB threshold for silence (closer to voice threshold to prevent dead zone)
const VOICE_THRESHOLD = -40; // dB threshold for voice activity (louder than silence)
const SILENCE_DURATION = 2000; // 2 seconds of silence to auto-stop (reduced for word-spell-word format)
const MIN_VOICE_DURATION = 500; // Minimum 500ms of voice to count as "started speaking"

export function useVoiceRecording() {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    error: null,
    timeRemaining: MAX_RECORDING_TIME,
    voiceDetected: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const voiceStartRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopCallbackRef = useRef<(() => void) | null>(null);
  const voiceDetectedRef = useRef<boolean>(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    voiceDetectedRef.current = false;
  }, []);

  // Voice activity detection function
  const checkVoiceActivity = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return false;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    const decibels = 20 * Math.log10(average / 255);

    const isSilent = decibels < SILENCE_THRESHOLD;
    const isVoice = decibels > VOICE_THRESHOLD;

    // DEBUG: Log audio levels and detection status
    console.log('[VAD]', {
      dB: decibels.toFixed(1),
      isSilent,
      isVoice,
      voiceDetected: voiceDetectedRef.current,
      silenceStart: silenceStartRef.current ? `${Date.now() - silenceStartRef.current}ms ago` : 'null'
    });

    // State machine for voice activity detection
    // Phase 1: Waiting for voice to start
    if (!voiceDetectedRef.current) {
      if (isVoice) {
        // Voice detected - start tracking
        if (voiceStartRef.current === null) {
          voiceStartRef.current = Date.now();
          console.log('[VAD] Voice START tracking - waiting for 500ms...');
        } else {
          const voiceDuration = Date.now() - voiceStartRef.current;
          if (voiceDuration >= MIN_VOICE_DURATION) {
            // User has been speaking for 500ms - mark as voice detected
            voiceDetectedRef.current = true;
            setState((prev) => ({ ...prev, voiceDetected: true }));
            silenceStartRef.current = null; // Reset silence timer
            console.log('[VAD] ✅ VOICE DETECTED! Moving to Phase 2 (silence detection)');
          }
        }
      } else {
        // Reset voice start timer if not speaking
        if (voiceStartRef.current !== null) {
          console.log('[VAD] Voice tracking reset - not loud enough yet');
        }
        voiceStartRef.current = null;
      }
      return false; // Don't trigger auto-stop yet
    }

    // Phase 2: Voice detected, now waiting for silence
    if (isSilent) {
      if (silenceStartRef.current === null) {
        silenceStartRef.current = Date.now();
        console.log('[VAD] Silence timer STARTED');
      } else {
        const silenceDuration = Date.now() - silenceStartRef.current;
        if (silenceDuration >= SILENCE_DURATION) {
          console.log('[VAD] AUTO-STOP TRIGGERED! Silence duration:', silenceDuration, 'ms');
          return true; // Silence detected for long enough - trigger auto-stop
        }
      }
    } else {
      if (silenceStartRef.current !== null) {
        console.log('[VAD] Silence timer RESET - voice/noise detected');
      }
      silenceStartRef.current = null; // Reset silence timer when voice detected
    }

    return false;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState({
        isRecording: false,
        isProcessing: false,
        error: null,
        timeRemaining: MAX_RECORDING_TIME,
        voiceDetected: false
      });

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio context for voice activity detection
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];
      silenceStartRef.current = null;
      voiceStartRef.current = null;
      voiceDetectedRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      setState({
        isRecording: true,
        isProcessing: false,
        error: null,
        timeRemaining: MAX_RECORDING_TIME,
        voiceDetected: false
      });

      // Start countdown timer
      let timeLeft = MAX_RECORDING_TIME;
      countdownIntervalRef.current = setInterval(() => {
        timeLeft -= 1;
        setState((prev) => ({ ...prev, timeRemaining: timeLeft }));

        if (timeLeft <= 0) {
          // Time's up! Auto-stop
          if (autoStopCallbackRef.current) {
            autoStopCallbackRef.current();
          }
        }
      }, 1000);

      // Start voice activity detection
      silenceCheckIntervalRef.current = setInterval(() => {
        if (checkVoiceActivity()) {
          // Silence detected after voice - auto-stop
          if (autoStopCallbackRef.current) {
            autoStopCallbackRef.current();
          }
        }
      }, 100); // Check every 100ms

    } catch (error) {
      console.error('Error starting recording:', error);
      cleanup();
      setState({
        isRecording: false,
        isProcessing: false,
        error: 'Failed to access microphone. Please check permissions.',
        timeRemaining: MAX_RECORDING_TIME,
        voiceDetected: false,
      });
    }
  }, [checkVoiceActivity, cleanup]);

  const stopRecording = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state !== 'recording') {
        cleanup();
        reject(new Error('No active recording'));
        return;
      }

      mediaRecorder.onstop = async () => {
        try {
          // Save voice detection status BEFORE cleanup resets it
          const hadVoiceActivity = voiceDetectedRef.current;
          console.log('[STOP] Voice was detected during recording:', hadVoiceActivity);

          cleanup();
          setState((prev) => ({ ...prev, isRecording: false, isProcessing: true }));

          // Create audio blob
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

          // Stop all tracks
          mediaRecorder.stream.getTracks().forEach((track) => track.stop());

          // Check if we have any audio data
          if (audioBlob.size === 0 || !hadVoiceActivity) {
            // No voice detected or empty recording - return empty string
            console.log('[STOP] Rejecting recording - size:', audioBlob.size, 'hadVoice:', hadVoiceActivity);
            setState({
              isRecording: false,
              isProcessing: false,
              error: null,
              timeRemaining: MAX_RECORDING_TIME,
              voiceDetected: false
            });
            resolve('');
            return;
          }

          console.log('[STOP] Sending to Whisper API - size:', audioBlob.size, 'bytes');

          // Send to Whisper API
          const result = await openAIService.speechToText(audioBlob);
          console.log('[STOP] Whisper result:', result.text);

          setState({
            isRecording: false,
            isProcessing: false,
            error: null,
            timeRemaining: MAX_RECORDING_TIME,
            voiceDetected: false
          });
          resolve(result.text);
        } catch (error) {
          console.error('Error processing audio:', error);
          cleanup();
          setState({
            isRecording: false,
            isProcessing: false,
            error: 'Failed to process audio. Please try again.',
            timeRemaining: MAX_RECORDING_TIME,
            voiceDetected: false,
          });
          reject(error);
        }
      };

      mediaRecorder.stop();
    });
  }, [cleanup]);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }

    cleanup();
    chunksRef.current = [];
    setState({
      isRecording: false,
      isProcessing: false,
      error: null,
      timeRemaining: MAX_RECORDING_TIME,
      voiceDetected: false
    });
  }, [cleanup]);

  // Register auto-stop callback
  const setAutoStopCallback = useCallback((callback: () => void) => {
    autoStopCallbackRef.current = callback;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    setAutoStopCallback,
  };
}
