import { useState, useRef, useCallback, useEffect } from 'react';

export type PatternState =
  | 'WAITING_FOR_FIRST_WORD'
  | 'WAITING_FOR_SPELLING'
  | 'WAITING_FOR_SECOND_WORD'
  | 'PATTERN_COMPLETE'
  | 'SUBMITTING';

export interface PatternRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  patternState: PatternState;
  detectedFirstWord: string | null;
  detectedLetters: string[];
  detectedSecondWord: string | null;
  timeRemaining: number;
  isSupported: boolean; // Whether Web Speech API is available
}

const MAX_RECORDING_TIME = 60;
const SILENCE_AFTER_PATTERN = 2000; // 2 seconds after pattern completes
const SILENCE_AFTER_STEP1 = 1000; // 1 second silence after word detected in step 1
const SILENCE_AFTER_LETTER = 1500; // 1.5 seconds silence after last letter in step 2

// Check if Web Speech API is available
const isSpeechRecognitionSupported = (): boolean => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

export function usePatternVoiceRecording(expectedWord: string) {
  const [state, setState] = useState<PatternRecordingState>({
    isRecording: false,
    isProcessing: false,
    error: null,
    patternState: 'WAITING_FOR_FIRST_WORD',
    detectedFirstWord: null,
    detectedLetters: [],
    detectedSecondWord: null,
    timeRemaining: MAX_RECORDING_TIME,
    isSupported: isSpeechRecognitionSupported(),
  });

  // MediaRecorder for Whisper fallback/verification
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Web Speech Recognition
  const recognitionRef = useRef<any>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitCallbackRef = useRef<(() => Promise<void>) | null>(null);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const step1SilenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectedLettersRef = useRef<string[]>([]);

  // Normalize word for comparison (lowercase, trim)
  const normalizeWord = (word: string): string => {
    return word.toLowerCase().trim();
  };

  // Check if a token is a single letter
  const isSingleLetter = (token: string): boolean => {
    const normalized = token.toLowerCase().trim();

    // Must be exactly 1 character and alphabetic
    return /^[a-zA-Z]$/.test(normalized);
  };

  // Check if a word matches the expected word
  const matchesExpectedWord = (word: string): boolean => {
    return normalizeWord(word) === normalizeWord(expectedWord);
  };

  // Start countdown timer
  const startCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          // Time's up - auto-submit
          if (autoSubmitCallbackRef.current) {
            autoSubmitCallbackRef.current();
          }
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);
  }, []);

  // Start pattern-based recording
  const startRecording = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Speech recognition not supported in this browser' }));
      return;
    }

    try {
      // Request microphone permission and start MediaRecorder
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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

      // Initialize Web Speech Recognition
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const results = event.results;
        const latestResult = results[results.length - 1];
        const transcript = latestResult[0].transcript.trim();

        // Split into tokens
        const tokens = transcript.toLowerCase().split(/[\s\-,._]+/).filter((t: string) => t.length > 0);
        const lastToken = tokens[tokens.length - 1];

        console.log('[PATTERN] Heard:', transcript);
        console.log('[PATTERN] Tokens:', tokens);
        console.log('[PATTERN] Last token:', lastToken);

        setState(prev => {
          const currentState = prev.patternState;
          console.log('[PATTERN] Current state:', currentState);

          // State 1: Waiting for first word
          if (currentState === 'WAITING_FOR_FIRST_WORD') {
            // Check all tokens for the expected word (more lenient)
            for (const token of tokens) {
              if (matchesExpectedWord(token)) {
                console.log('[PATTERN] ✓ First word detected:', token);

                // FIXED: Don't immediately transition - wait 1 second of silence first
                // Clear any previous silence timer
                if (step1SilenceTimerRef.current) {
                  clearTimeout(step1SilenceTimerRef.current);
                }

                // Set detected word but stay in step 1
                const newState = {
                  ...prev,
                  detectedFirstWord: token,
                };

                // Start 1-second silence timer
                step1SilenceTimerRef.current = setTimeout(() => {
                  setState(prevState => {
                    if (prevState.patternState === 'WAITING_FOR_FIRST_WORD' && prevState.detectedFirstWord) {
                      console.log('[PATTERN] ⏱️ 1s silence after word - moving to step 2');

                      // Reset last detected letters for fresh start in step 2
                      lastDetectedLettersRef.current = [];

                      return {
                        ...prevState,
                        patternState: 'WAITING_FOR_SPELLING',
                      };
                    }
                    return prevState;
                  });
                }, SILENCE_AFTER_STEP1);

                return newState;
              }
            }
          }

          // State 2: Waiting for spelling (C-A-T)
          else if (currentState === 'WAITING_FOR_SPELLING') {
            // Collect single letters from all tokens
            const newLetters = tokens.filter(isSingleLetter);

            console.log('[PATTERN] Single letters found in this result:', newLetters);
            console.log('[PATTERN] Current letters:', prev.detectedLetters);
            console.log('[PATTERN] Last detected:', lastDetectedLettersRef.current);
            console.log('[PATTERN] Expected word length:', expectedWord.length);

            if (newLetters.length > 0) {
              // FIXED: Prevent duplicates by comparing with last detection
              // Only add letters that weren't in the previous recognition result
              const lastLettersSet = new Set(lastDetectedLettersRef.current);
              const trulyNewLetters = newLetters.filter((letter: string) => !lastLettersSet.has(letter));

              console.log('[PATTERN] Truly new letters (after dedup):', trulyNewLetters);

              if (trulyNewLetters.length > 0) {
                // Append only the truly new letters
                const allLetters = [...prev.detectedLetters, ...trulyNewLetters];

                console.log('[PATTERN] All letters accumulated:', allLetters);
                console.log('[PATTERN] Letter count:', allLetters.length, '/', expectedWord.length);

                // Update last detected letters for next comparison
                lastDetectedLettersRef.current = newLetters;

                // Clear previous timeout and set new one
                if (stepTimeoutRef.current) {
                  clearTimeout(stepTimeoutRef.current);
                }

                // FIXED: Changed timeout to 1.5 seconds (faster progression)
                // Only auto-progress if we have at least 2 letters
                stepTimeoutRef.current = setTimeout(() => {
                  setState(prevState => {
                    if (prevState.patternState === 'WAITING_FOR_SPELLING' && prevState.detectedLetters.length >= 2) {
                      console.log('[PATTERN] ⏱️ Timeout (1.5s silence) - auto-progressing to step 3 with', prevState.detectedLetters.length, 'letters');
                      return {
                        ...prevState,
                        patternState: 'WAITING_FOR_SECOND_WORD',
                      };
                    }
                    return prevState;
                  });
                }, SILENCE_AFTER_LETTER); // 1500ms

                return { ...prev, detectedLetters: allLetters };
              } else {
                // Same letters as last time - just update the reference
                lastDetectedLettersRef.current = newLetters;
                console.log('[PATTERN] No new letters (duplicates filtered)');
              }
            }
          }

          // State 3: Waiting for second word
          else if (currentState === 'WAITING_FOR_SECOND_WORD') {
            // Look for the word again
            for (const token of tokens) {
              if (!isSingleLetter(token) && matchesExpectedWord(token)) {
                console.log('[PATTERN] ✓ Second word detected:', token);
                return {
                  ...prev,
                  patternState: 'PATTERN_COMPLETE',
                  detectedSecondWord: token,
                };
              }
            }
          }

          return prev;
        });
      };

      recognition.onerror = (event: any) => {
        console.error('[PATTERN] Recognition error:', event.error);
        setState(prev => ({ ...prev, error: `Speech recognition error: ${event.error}` }));
      };

      recognition.start();
      recognitionRef.current = recognition;

      // Update state
      setState(prev => ({
        ...prev,
        isRecording: true,
        patternState: 'WAITING_FOR_FIRST_WORD',
        detectedFirstWord: null,
        detectedLetters: [],
        detectedSecondWord: null,
        timeRemaining: MAX_RECORDING_TIME,
        error: null,
      }));

      startCountdown();
    } catch (error: any) {
      console.error('[PATTERN] Error starting recording:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to start recording',
        isRecording: false,
      }));
    }
  }, [state.isSupported, state.patternState, expectedWord, startCountdown]);

  // Stop recording and return the audio blob
  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No recording in progress'));
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        chunksRef.current = [];

        // Stop recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }

        // Clear intervals
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        if (stepTimeoutRef.current) {
          clearTimeout(stepTimeoutRef.current);
          stepTimeoutRef.current = null;
        }

        if (step1SilenceTimerRef.current) {
          clearTimeout(step1SilenceTimerRef.current);
          step1SilenceTimerRef.current = null;
        }

        // Reset last detected letters
        lastDetectedLettersRef.current = [];

        // Stop media stream
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        setState(prev => ({
          ...prev,
          isRecording: false,
          isProcessing: false,
        }));

        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, []);

  // Monitor pattern completion and trigger auto-submit
  useEffect(() => {
    if (state.patternState === 'PATTERN_COMPLETE' && state.isRecording) {
      console.log('[PATTERN] Pattern complete! Starting silence timer...');

      // Start 2-second silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      setState(prev => ({ ...prev, patternState: 'SUBMITTING' }));

      silenceTimerRef.current = setTimeout(() => {
        console.log('[PATTERN] Silence period complete, triggering auto-submit');
        if (autoSubmitCallbackRef.current) {
          autoSubmitCallbackRef.current();
        }
      }, SILENCE_AFTER_PATTERN);
    }
  }, [state.patternState, state.isRecording]);

  // Set auto-submit callback
  const setAutoSubmitCallback = useCallback((callback: () => Promise<void>) => {
    autoSubmitCallbackRef.current = callback;
  }, []);

  // Manually finish spelling and move to step 3
  const finishSpelling = useCallback(() => {
    setState(prev => {
      if (prev.patternState === 'WAITING_FOR_SPELLING' && prev.detectedLetters.length >= 2) {
        console.log('[PATTERN] Manual finish - progressing to step 3 with', prev.detectedLetters.length, 'letters');

        // Clear timeout since we're manually progressing
        if (stepTimeoutRef.current) {
          clearTimeout(stepTimeoutRef.current);
          stepTimeoutRef.current = null;
        }

        return {
          ...prev,
          patternState: 'WAITING_FOR_SECOND_WORD',
        };
      }
      return prev;
    });
  }, []);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }

    if (step1SilenceTimerRef.current) {
      clearTimeout(step1SilenceTimerRef.current);
      step1SilenceTimerRef.current = null;
    }

    // Reset last detected letters
    lastDetectedLettersRef.current = [];

    setState(prev => ({
      ...prev,
      isRecording: false,
      isProcessing: false,
      patternState: 'WAITING_FOR_FIRST_WORD',
      detectedFirstWord: null,
      detectedLetters: [],
      detectedSecondWord: null,
    }));
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    setAutoSubmitCallback,
    finishSpelling,
  };
}
