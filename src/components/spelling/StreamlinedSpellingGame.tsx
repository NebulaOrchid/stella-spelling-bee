import { useEffect, useCallback, useRef } from 'react';
import { useSpelling } from '../../contexts/SpellingContext';
import { useGym } from '../../contexts/GymContext';
import { useGameFlow } from '../../hooks/useGameFlow';
import { useSimpleVoiceRecording } from '../../hooks/useSimpleVoiceRecording';
import { calculateMiniGameResult } from '../../utils/starCalculator';
import { soundManager } from '../../services/sound/soundManager';
import { openAIService } from '../../services/api';
import { Button } from '../common/Button';
import { TypeBadgeAnimation } from './pokemon/TypeBadgeAnimation';
import { ThreePokeballProgress } from './pokemon/ThreePokeballProgress';
import { LoadingState } from './game-states/LoadingState';
import { ReadyState } from './game-states/ReadyState';
import { RecordingState } from './game-states/RecordingState';
import { ProcessingState } from './game-states/ProcessingState';
import { RevealingState } from './game-states/RevealingState';
import { ResultState } from './game-states/ResultState';

/**
 * Extract spelled letters from Whisper transcription
 *
 * Example transcriptions:
 * - "cat c a t cat" → "cat"
 * - "dismissal d i s m i s s a l dismissal" → "dismissal"
 * - "the word is cat spelled c a t" → "cat"
 *
 * @param transcription - Raw Whisper transcription
 * @param expectedWord - Word being spelled (for validation)
 * @returns Extracted letters joined as string
 */
function extractSpelledLetters(transcription: string, expectedWord: string): string {
  console.log('[EXTRACT] Analyzing Whisper transcription for spelled letters...');
  console.log('[EXTRACT] Transcription:', transcription);
  console.log('[EXTRACT] Expected word:', expectedWord);

  // Normalize transcription
  const normalized = transcription.toLowerCase().trim();

  // Split into tokens (words/letters)
  const tokens = normalized.split(/[\s,.-]+/).filter(t => t.length > 0);
  console.log('[EXTRACT] Tokens:', tokens);

  // Strategy: Find sequence of single-letter tokens
  // Expected pattern: "word c a t word" or "c a t"
  const letters: string[] = [];
  let inSpellingSequence = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Check if token is a single letter
    if (/^[a-z]$/.test(token)) {
      letters.push(token);
      inSpellingSequence = true;
    }
    // If we were in a spelling sequence and hit a non-letter,
    // check if it's the expected word (end of pattern)
    else if (inSpellingSequence && token === expectedWord.toLowerCase()) {
      break; // Found end of spelling pattern
    }
  }

  console.log('[EXTRACT] Extracted letters:', letters);

  // If we found reasonable number of letters, return them
  if (letters.length >= 2) {
    return letters.join('');
  }

  // Fallback: If no letters found, try to extract from middle section
  // Pattern might be: "dismissal [letters] dismissal"
  const wordIndices = tokens.reduce((acc, token, idx) => {
    if (token === expectedWord.toLowerCase()) acc.push(idx);
    return acc;
  }, [] as number[]);

  if (wordIndices.length >= 2) {
    // Extract tokens between first and last word occurrence
    const startIdx = wordIndices[0] + 1;
    const endIdx = wordIndices[wordIndices.length - 1];
    const middleTokens = tokens.slice(startIdx, endIdx);
    const middleLetters = middleTokens.filter(t => /^[a-z]$/.test(t));

    if (middleLetters.length >= 2) {
      console.log('[EXTRACT] Using middle section:', middleLetters);
      return middleLetters.join('');
    }
  }

  // Last resort: return whatever single letters we found
  console.warn('[EXTRACT] Could not find clear pattern, returning all single letters');
  return letters.join('');
}

/**
 * Streamlined single-screen spelling game with Pokemon theme
 *
 * Combines the previous 4-box layout into one mobile-optimized interface:
 * - Loading state with Pokeball wobble
 * - Recording state with pattern steps
 * - Revealing state with word animation
 * - Result state with Pokemon-themed feedback
 */
export function StreamlinedSpellingGame() {
  const { currentWord, currentAttempt, session, startSession, endSession, submitAttempt, setCurrentAttempt, isCorrect, nextWord } = useSpelling();
  const { selectedGym, selectedMiniGame, miniGameWords, completeMiniGame, returnToGymDetail } = useGym();

  // Game flow state machine
  const {
    gameFlowState,
    transitionTo,
    reset,
  } = useGameFlow({
    onLoadingComplete: () => {
      // Word pronunciation complete, ready to record
      console.log('[StreamlinedGame] Loading complete, transitioning to READY');
    },
    onRecordingStart: () => {
      console.log('[StreamlinedGame] Recording started');
    },
    onRecordingComplete: () => {
      console.log('[StreamlinedGame] Recording complete, processing...');
    },
    onProcessingComplete: () => {
      console.log('[StreamlinedGame] Processing complete, revealing word');
    },
    onRevealComplete: () => {
      console.log('[StreamlinedGame] Reveal complete, showing result');
    },
  });

  // Voice recording hook with pattern detection
  const {
    isRecording,
    timeRemaining,
    currentStep,
    step1Complete,
    step2Complete,
    step3Complete,
    detectedWord,
    detectedLetters,
    startRecording,
    stopRecording,
    setAutoSubmitCallback,
  } = useSimpleVoiceRecording(currentWord?.word || '');

  // Start session when mini-game words are loaded
  useEffect(() => {
    if (miniGameWords.length > 0 && !session) {
      console.log('[StreamlinedGame] Starting session with', miniGameWords.length, 'words');
      startSession(miniGameWords);
    }
  }, [miniGameWords, session, startSession]);

  // Reset state when word changes
  useEffect(() => {
    if (currentWord) {
      console.log('[StreamlinedGame] New word, resetting to LOADING');
      reset();
    }
  }, [currentWord?.id, reset]);

  // Auto-end game when all words are completed
  useEffect(() => {
    if (!currentWord && session && session.wordAttempts.length > 0 && selectedMiniGame) {
      handleCompleteGame();
    }
  }, [currentWord, session, selectedMiniGame]);

  // Handle recording completion and submission
  const handleDoneRecording = useCallback(async () => {
    if (!currentWord) return;

    transitionTo('PROCESSING');

    // Get audio blob from recording
    const audioBlob = await stopRecording();
    if (!audioBlob) {
      console.error('[StreamlinedGame] No audio blob to submit');
      transitionTo('RECORDING'); // Go back to recording if failed
      return;
    }

    try {
      // ✅ Send to Whisper API for accurate transcription
      console.log('[StreamlinedGame] Sending audio to Whisper API...');
      const whisperResponse = await openAIService.speechToText(audioBlob);
      console.log('[StreamlinedGame] Whisper transcription:', whisperResponse.text);

      // Extract spelled letters from transcription
      const spelling = extractSpelledLetters(whisperResponse.text, currentWord.word);
      console.log('[StreamlinedGame] Extracted spelling:', spelling);
      console.log('[StreamlinedGame] Expected word:', currentWord.word);
      console.log('[StreamlinedGame] Match?', spelling.toLowerCase() === currentWord.word.toLowerCase());

      // Submit final spelling
      setCurrentAttempt(spelling);
      submitAttempt();

      transitionTo('REVEALING');
    } catch (error) {
      console.error('[StreamlinedGame] Whisper API error:', error);

      // If Whisper fails, show error and go back to recording
      transitionTo('RECORDING');
      alert('Error processing audio. Please try again.');
    }
  }, [currentWord, stopRecording, transitionTo, setCurrentAttempt, submitAttempt]);

  // Set auto-submit callback for timer expiry
  useEffect(() => {
    setAutoSubmitCallback(handleDoneRecording);
  }, [setAutoSubmitCallback, handleDoneRecording]);

  // Handle word pronunciation complete
  const handlePronunciationComplete = useCallback(() => {
    console.log('[StreamlinedGame] ✅ Pronunciation complete - audio finished playing');

    // CRITICAL: Wait 2 seconds after audio finishes before starting recording
    // This prevents microphone from picking up:
    // 1. Tail end of TTS audio
    // 2. Speaker output bleeding into microphone
    // 3. Audio buffer echoes
    setTimeout(() => {
      console.log('[StreamlinedGame] ⏰ 2 seconds passed - Starting recording NOW');
      transitionTo('RECORDING');
      startRecording();
    }, 2000);
  }, [transitionTo, startRecording]);

  // Store current word text for replay functionality
  const currentWordTextRef = useRef<string>('');
  const currentAudioUrlRef = useRef<string>('');

  // Play word pronunciation (used for initial play and replay)
  const playWordPronunciation = useCallback(async (onComplete?: () => void) => {
    if (!currentWord) return;

    const startTime = Date.now();

    try {
      console.log('[StreamlinedGame] 🔊 [T+0ms] Starting word pronunciation...');

      // Build text: word → definition → word again
      const text = currentWord.definition
        ? `${currentWord.word}. ${currentWord.definition}. ${currentWord.word}.`
        : `${currentWord.word}. ${currentWord.word}.`;

      console.log('[StreamlinedGame] 📝 TTS text:', text);

      // Generate or reuse cached audio
      if (currentWordTextRef.current !== text) {
        console.log('[StreamlinedGame] 🎵 Generating new TTS audio...');
        const { audioUrl } = await openAIService.textToSpeech(text, 'nova', 1.0);
        currentAudioUrlRef.current = audioUrl;
        currentWordTextRef.current = text;
        const elapsed = Date.now() - startTime;
        console.log(`[StreamlinedGame] ✅ [T+${elapsed}ms] TTS audio generated`);
      } else {
        console.log('[StreamlinedGame] ♻️ Reusing cached TTS audio');
      }

      const playStartTime = Date.now();
      console.log(`[StreamlinedGame] ▶️ [T+${playStartTime - startTime}ms] AUDIO PLAYBACK STARTING...`);

      await soundManager.playWord(currentAudioUrlRef.current);

      const playEndTime = Date.now();
      const audioDuration = playEndTime - playStartTime;
      console.log(`[StreamlinedGame] ⏹️ [T+${playEndTime - startTime}ms] AUDIO PLAYBACK FINISHED (duration: ${audioDuration}ms)`);

      if (onComplete) {
        const completeTime = Date.now();
        console.log(`[StreamlinedGame] 🎯 [T+${completeTime - startTime}ms] Calling onComplete callback`);
        onComplete();
      }
    } catch (error) {
      console.error('[StreamlinedGame] ❌ Error playing word:', error);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentWord]);

  // Auto-play word pronunciation when entering LOADING state
  useEffect(() => {
    if (gameFlowState === 'LOADING' && currentWord) {
      console.log('[StreamlinedGame] ========================================');
      console.log('[StreamlinedGame] 📍 LOADING state entered');
      console.log('[StreamlinedGame] 🔊 Playing sound immediately...');
      console.log('[StreamlinedGame] ========================================');

      // Play sound immediately (no delay)
      playWordPronunciation(handlePronunciationComplete);
    }
  }, [gameFlowState, currentWord, playWordPronunciation, handlePronunciationComplete]);

  // Handle reveal animation complete
  const handleRevealComplete = useCallback(() => {
    console.log('[StreamlinedGame] Reveal complete, showing result');
    if (isCorrect) {
      transitionTo('RESULT_CORRECT');
    } else {
      transitionTo('RESULT_INCORRECT');
    }
  }, [isCorrect, transitionTo]);

  // Handle next word
  const handleNextWord = useCallback(() => {
    transitionTo('TRANSITIONING');

    // Move to next word (context handles this)
    nextWord();

    // The useEffect watching currentWord will reset to LOADING
  }, [nextWord, transitionTo]);

  // Handle game completion
  const handleCompleteGame = () => {
    if (!session || !selectedMiniGame) return;

    console.log('[StreamlinedGame] Mini-game complete, calculating result');

    // Calculate mini-game result
    const result = calculateMiniGameResult(selectedMiniGame.id, session.wordAttempts);

    // Complete mini-game (triggers celebrations if star earned)
    completeMiniGame(result);

    // End spelling session
    endSession();
  };

  // Handle end game early
  const handleEndGameEarly = () => {
    console.log('[StreamlinedGame] Ending game early');
    endSession();
    returnToGymDetail();
  };

  // Loading or waiting for words
  if (!selectedGym || !selectedMiniGame || miniGameWords.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐝</div>
          <p className="text-xl text-text-muted">Loading mini-game...</p>
        </div>
      </div>
    );
  }

  // Wait for session to start
  if (!session || !currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐝</div>
          <p className="text-xl text-text-muted">Starting challenge...</p>
        </div>
      </div>
    );
  }

  // Calculate progress
  const completedWordIds = new Set(session.wordAttempts.filter(a => a.wordId !== currentWord.id).map(a => a.wordId));
  const progress = completedWordIds.size;
  const total = miniGameWords.length;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: `${selectedGym.color}10` }}>
      <div className="min-h-screen flex flex-col p-4 safe-area-inset">
        {/* Header - Fixed top section */}
        <div className="h-20 flex-shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <TypeBadgeAnimation
              emoji={selectedGym.emoji}
              name={selectedGym.name}
              color={selectedGym.color}
              animated={gameFlowState === 'LOADING'}
            />
            <p className="text-sm text-text-muted">
              Word {progress + 1} of {total}
            </p>
          </div>
          <Button variant="error" size="sm" onClick={handleEndGameEarly}>
            End
          </Button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface rounded-full h-2 overflow-hidden mb-4 flex-shrink-0">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${(progress / total) * 100}%`,
              backgroundColor: selectedGym.color,
            }}
          />
        </div>

        {/* Game area - Grows to fill */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          {gameFlowState === 'LOADING' && (
            <LoadingState color={selectedGym.color} />
          )}

          {gameFlowState === 'READY' && (
            <ReadyState color={selectedGym.color} />
          )}

          {gameFlowState === 'RECORDING' && (
            <RecordingState
              color={selectedGym.color}
              timeRemaining={timeRemaining}
              isRecording={isRecording}
            />
          )}

          {gameFlowState === 'PROCESSING' && (
            <ProcessingState color={selectedGym.color} />
          )}

          {gameFlowState === 'REVEALING' && (
            <RevealingState
              word={currentWord.word}
              isCorrect={isCorrect ?? false}
              color={selectedGym.color}
              onComplete={handleRevealComplete}
            />
          )}

          {(gameFlowState === 'RESULT_CORRECT' || gameFlowState === 'RESULT_INCORRECT') && (
            <ResultState
              word={currentWord.word}
              definition={currentWord.definition}
              isCorrect={isCorrect ?? false}
              userSpelling={currentAttempt}
              color={selectedGym.color}
              onNextWord={handleNextWord}
            />
          )}
        </div>

        {/* Three Pokeball Progress */}
        {gameFlowState === 'RECORDING' && (
          <div className="h-auto flex-shrink-0 mt-4">
            <ThreePokeballProgress
              color={selectedGym.color}
              currentStep={currentStep}
              step1Complete={step1Complete}
              step2Complete={step2Complete}
              step3Complete={step3Complete}
              step1Text={detectedWord || undefined}
              step2Text={detectedLetters.length > 0 ? detectedLetters.join(' - ').toUpperCase() : undefined}
              isSubmitting={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
