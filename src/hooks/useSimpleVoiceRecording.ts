import { useState, useRef, useCallback } from 'react';

const MAX_RECORDING_TIME = 60; // 60 seconds max

export interface SimpleRecordingState {
  isRecording: boolean;
  timeRemaining: number;         // Countdown from 60 → 0
  error: string | null;
  // Pattern detection state (Web Speech API - visual feedback only)
  currentStep: 1 | 2 | 3;
  step1Complete: boolean;
  step2Complete: boolean;
  step3Complete: boolean;
  detectedWord: string | null;
  detectedLetters: string[];
}

/**
 * Voice recording hook with pattern detection for visual feedback
 *
 * Uses hybrid approach:
 * - MediaRecorder for audio capture (sent to Whisper API)
 * - Web Speech API for visual feedback only (not used for grading)
 * - Final submission uses Whisper API transcription (accurate)
 */
export function useSimpleVoiceRecording(expectedWord: string = '') {
  const [state, setState] = useState<SimpleRecordingState>({
    isRecording: false,
    timeRemaining: MAX_RECORDING_TIME,
    error: null,
    currentStep: 1,
    step1Complete: false,
    step2Complete: false,
    step3Complete: false,
    detectedWord: null,
    detectedLetters: [],
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const autoSubmitCallbackRef = useRef<(() => Promise<void>) | null>(null);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectedLettersRef = useRef<string[]>([]);

  // Normalize word for comparison
  const normalizeWord = (word: string): string => {
    return word.toLowerCase().trim();
  };

  // Check if token is a single letter
  const isSingleLetter = (token: string): boolean => {
    const normalized = token.toLowerCase().trim();
    return /^[a-zA-Z]$/.test(normalized);
  };

  // Check if word matches expected word
  const matchesExpectedWord = (word: string): boolean => {
    return normalizeWord(word) === normalizeWord(expectedWord);
  };

  // Update pattern state based on detected speech
  const updatePatternState = useCallback((transcript: string) => {
    const tokens = transcript.toLowerCase().split(/[\s\-,._]+/).filter((t: string) => t.length > 0);

    console.log('[PATTERN] Heard:', transcript);
    console.log('[PATTERN] Tokens:', tokens);

    setState(prev => {
      // Step 1: Waiting for first word
      if (prev.currentStep === 1) {
        for (const token of tokens) {
          if (matchesExpectedWord(token)) {
            console.log('[PATTERN] ✓ First word detected:', token);
            return {
              ...prev,
              step1Complete: true,
              currentStep: 2 as const,
              detectedWord: expectedWord,
            };
          }
        }
      }

      // Step 2: Waiting for spelling (C-A-T)
      else if (prev.currentStep === 2) {
        const newLetters = tokens.filter(isSingleLetter);

        if (newLetters.length > 0) {
          // Prevent duplicates by comparing with last detection
          const lastLettersSet = new Set(lastDetectedLettersRef.current);
          const trulyNewLetters = newLetters.filter((letter: string) => !lastLettersSet.has(letter));

          if (trulyNewLetters.length > 0) {
            const allLetters = [...prev.detectedLetters, ...trulyNewLetters];
            console.log('[PATTERN] Letters accumulated:', allLetters);

            // Update last detected letters
            lastDetectedLettersRef.current = newLetters;

            // Clear previous timeout and set new one
            if (stepTimeoutRef.current) {
              clearTimeout(stepTimeoutRef.current);
            }

            // Auto-progress to step 3 after 1.5s silence
            stepTimeoutRef.current = setTimeout(() => {
              setState(prevState => {
                if (prevState.currentStep === 2 && prevState.detectedLetters.length >= 2) {
                  console.log('[PATTERN] ⏱️ 1.5s silence - auto-progressing to step 3');
                  return {
                    ...prevState,
                    step2Complete: true,
                    currentStep: 3 as const,
                  };
                }
                return prevState;
              });
            }, 1500);

            return { ...prev, detectedLetters: allLetters };
          } else {
            // Same letters as last time
            lastDetectedLettersRef.current = newLetters;
          }
        }
      }

      // Step 3: Waiting for second word
      else if (prev.currentStep === 3) {
        for (const token of tokens) {
          if (!isSingleLetter(token) && matchesExpectedWord(token)) {
            console.log('[PATTERN] ✓ Second word detected:', token);

            // Clear any previous timeout
            if (stepTimeoutRef.current) {
              clearTimeout(stepTimeoutRef.current);
            }

            // Auto-submit after 1 second of silence
            stepTimeoutRef.current = setTimeout(() => {
              console.log('[PATTERN] ⏱️ 1s silence after step 3 - auto-submitting...');
              if (autoSubmitCallbackRef.current) {
                autoSubmitCallbackRef.current();
              }
            }, 1000);

            return {
              ...prev,
              step3Complete: true,
            };
          }
        }
      }

      return prev;
    });
  }, [expectedWord]);

  // Start recording with Web Speech recognition
  const startRecording = useCallback(async () => {
    try {
      console.log('[SimpleRecording] Starting recording...');

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      // Setup Web Speech Recognition (for visual feedback only)
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const results = event.results;
          const latestResult = results[results.length - 1];
          const transcript = latestResult[0].transcript.trim();
          updatePatternState(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('[PATTERN] Recognition error:', event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      // Start countdown timer
      setState(prev => ({
        ...prev,
        isRecording: true,
        timeRemaining: MAX_RECORDING_TIME,
        currentStep: 1,
        step1Complete: false,
        step2Complete: false,
        step3Complete: false,
        detectedWord: null,
        detectedLetters: [],
        error: null,
      }));

      timerIntervalRef.current = setInterval(() => {
        setState(prev => {
          const newTime = prev.timeRemaining - 1;

          // Auto-submit at 0
          if (newTime <= 0) {
            console.log('[SimpleRecording] Timer expired, auto-submitting...');
            if (autoSubmitCallbackRef.current) {
              autoSubmitCallbackRef.current();
            }
            return { ...prev, timeRemaining: 0 };
          }

          return { ...prev, timeRemaining: newTime };
        });
      }, 1000);

      console.log('[SimpleRecording] Recording started');
    } catch (error: any) {
      console.error('[SimpleRecording] Error starting recording:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to start recording',
        isRecording: false,
      }));
    }
  }, [updatePatternState]);

  // Stop recording and return audio blob
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        console.warn('[SimpleRecording] No recording to stop');
        resolve(null);
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder.onstop = () => {
        console.log('[SimpleRecording] Recording stopped, creating blob...');

        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        chunksRef.current = [];

        // Stop Web Speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }

        // Stop media stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Clear timers
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        if (stepTimeoutRef.current) {
          clearTimeout(stepTimeoutRef.current);
          stepTimeoutRef.current = null;
        }

        // Reset last detected letters
        lastDetectedLettersRef.current = [];

        setState(prev => ({
          ...prev,
          isRecording: false,
          timeRemaining: MAX_RECORDING_TIME,
        }));

        console.log('[SimpleRecording] Blob created, size:', blob.size);
        resolve(blob);
      };

      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      } else {
        resolve(null);
      }
    });
  }, []);

  // Set auto-submit callback (called when timer expires)
  const setAutoSubmitCallback = useCallback((callback: () => Promise<void>) => {
    autoSubmitCallbackRef.current = callback;
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    setAutoSubmitCallback,
  };
}
