import { useState, useEffect, useCallback } from 'react';

/**
 * Game flow states for the streamlined single-screen spelling game
 */
export type GameFlowState =
  | 'LOADING'           // Playing word audio with Pokeball wobble
  | 'READY'             // Audio complete, pattern steps shown
  | 'RECORDING'         // Active pattern recording (steps animate)
  | 'PROCESSING'        // Whisper transcription in progress
  | 'REVEALING'         // Word reveal letter-by-letter animation
  | 'RESULT_CORRECT'    // Success with Pokeball burst
  | 'RESULT_INCORRECT'  // Encouragement with letter comparison
  | 'TRANSITIONING';    // Moving to next word

export interface GameFlowCallbacks {
  onLoadingComplete?: () => void;
  onRecordingStart?: () => void;
  onRecordingComplete?: () => void;
  onProcessingComplete?: () => void;
  onRevealComplete?: () => void;
  onResultComplete?: () => void;
}

export interface UseGameFlowReturn {
  gameFlowState: GameFlowState;
  setGameFlowState: (state: GameFlowState) => void;
  shouldShowWord: boolean;
  shouldShowDefinition: boolean;
  isInteractive: boolean;
  transitionTo: (state: GameFlowState) => void;
  reset: () => void;
}

/**
 * Custom hook to manage game flow state machine
 *
 * State Flow:
 * LOADING → READY → RECORDING → PROCESSING → REVEALING →
 * RESULT_CORRECT/INCORRECT → TRANSITIONING → LOADING (next word)
 */
export const useGameFlow = (callbacks: GameFlowCallbacks = {}): UseGameFlowReturn => {
  const [gameFlowState, setGameFlowState] = useState<GameFlowState>('LOADING');

  // Word text is hidden until REVEALING state
  const shouldShowWord = ['REVEALING', 'RESULT_CORRECT', 'RESULT_INCORRECT'].includes(gameFlowState);

  // Definition shown only in result states
  const shouldShowDefinition = ['RESULT_CORRECT', 'RESULT_INCORRECT'].includes(gameFlowState);

  // Interactive states where user can perform actions
  const isInteractive = ['READY', 'RECORDING', 'RESULT_CORRECT', 'RESULT_INCORRECT'].includes(gameFlowState);

  // Transition with callback execution
  const transitionTo = useCallback((newState: GameFlowState) => {
    console.log(`[useGameFlow] Transitioning: ${gameFlowState} → ${newState}`);
    setGameFlowState(newState);

    // Execute callbacks based on new state
    switch (newState) {
      case 'READY':
        callbacks.onLoadingComplete?.();
        break;
      case 'RECORDING':
        callbacks.onRecordingStart?.();
        break;
      case 'PROCESSING':
        callbacks.onRecordingComplete?.();
        break;
      case 'REVEALING':
        callbacks.onProcessingComplete?.();
        break;
      case 'RESULT_CORRECT':
      case 'RESULT_INCORRECT':
        callbacks.onRevealComplete?.();
        break;
      case 'TRANSITIONING':
        callbacks.onResultComplete?.();
        break;
    }
  }, [gameFlowState, callbacks]);

  // Reset to initial state
  const reset = useCallback(() => {
    console.log('[useGameFlow] Resetting to LOADING state');
    setGameFlowState('LOADING');
  }, []);

  // Log state changes for debugging
  useEffect(() => {
    console.log(`[useGameFlow] Current state: ${gameFlowState}`);
  }, [gameFlowState]);

  return {
    gameFlowState,
    setGameFlowState,
    shouldShowWord,
    shouldShowDefinition,
    isInteractive,
    transitionTo,
    reset,
  };
};
