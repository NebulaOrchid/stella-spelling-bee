import { useEffect, useState } from 'react';
import { useSpelling } from '../../contexts/SpellingContext';
import { useGym } from '../../contexts/GymContext';
import { VoiceInputWhisperOnly } from './VoiceInputWhisperOnly';
import { Feedback } from './Feedback';
import { Button } from '../common/Button';
import { calculateMiniGameResult } from '../../utils/starCalculator';
import { openAIService } from '../../services/api';
import { soundManager } from '../../services/sound';

export function SpellingGame() {
  const { currentWord, showFeedback, session, startSession, endSession } = useSpelling();
  const { selectedGym, selectedMiniGame, miniGameWords, completeMiniGame, returnToGymDetail } = useGym();
  // Start as TRUE to prevent recording from starting before pronunciation
  const [isPronouncingWord, setIsPronouncingWord] = useState(true);

  // Start session when mini-game words are loaded
  useEffect(() => {
    if (miniGameWords.length > 0 && !session) {
      console.log('[SPELLING GAME] Starting session with', miniGameWords.length, 'words');
      startSession(miniGameWords);
    }
  }, [miniGameWords, session, startSession]);

  // Auto-pronounce word when it changes
  useEffect(() => {
    if (!currentWord) return;

    console.log('[SPELLING GAME] ═══════════════════════════════════════');
    console.log('[SPELLING GAME] 🆕 NEW WORD EFFECT TRIGGERED');
    console.log('[SPELLING GAME] Word:', currentWord.word);
    console.log('[SPELLING GAME] Setting isPronouncingWord = TRUE');
    console.log('[SPELLING GAME] ═══════════════════════════════════════');

    // Set to TRUE immediately when new word loads - prevents recording from starting
    setIsPronouncingWord(true);

    const pronounceWord = async () => {
      try {
        console.log('[SPELLING GAME] ⏱️  Starting 500ms delay before pronunciation...');
        // Small delay to show UI before starting pronunciation (0.5s)
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('[SPELLING GAME] 🔊 500ms delay complete, starting pronunciation for:', currentWord.word);

        // Create pronunciation text: word → definition → word
        const text = currentWord.definition
          ? `${currentWord.word}. ${currentWord.definition}. ${currentWord.word}.`
          : `${currentWord.word}. ${currentWord.word}.`;

        console.log('[SPELLING GAME] 📡 Requesting TTS from OpenAI...');
        const startTime = Date.now();
        const { audioUrl } = await openAIService.textToSpeech(text, 'nova', 1.0);
        const ttsTime = Date.now() - startTime;
        console.log(`[SPELLING GAME] ✅ TTS received in ${ttsTime}ms`);

        console.log('[SPELLING GAME] 🔉 Playing audio (word → definition → word)...');
        const playStartTime = Date.now();
        await soundManager.playWord(audioUrl);
        const playTime = Date.now() - playStartTime;
        console.log(`[SPELLING GAME] ✅ Audio playback complete in ${playTime}ms`);

        console.log('[SPELLING GAME] ✅ Full pronunciation complete - ready for recording');
      } catch (error) {
        console.error('[SPELLING GAME] ❌ Error pronouncing word:', error);
        // Even if pronunciation fails, continue with the game
        // Don't block the user from spelling
      } finally {
        // Set false AFTER audio has completely finished playing
        console.log('[SPELLING GAME] ═══════════════════════════════════════');
        console.log('[SPELLING GAME] 🏁 SETTING isPronouncingWord = FALSE');
        console.log('[SPELLING GAME] Recording can now start');
        console.log('[SPELLING GAME] ═══════════════════════════════════════');
        setIsPronouncingWord(false);
      }
    };

    pronounceWord();
  }, [currentWord?.id]);

  // Auto-end game when all words are completed
  useEffect(() => {
    if (!currentWord && session && session.wordAttempts.length > 0 && selectedMiniGame) {
      handleCompleteGame();
    }
  }, [currentWord, session, selectedMiniGame]);

  const handleCompleteGame = () => {
    if (!session || !selectedMiniGame) return;

    console.log('[SPELLING GAME] Mini-game complete, calculating result');

    // Calculate mini-game result
    const result = calculateMiniGameResult(selectedMiniGame.id, session.wordAttempts);

    // Complete mini-game (triggers celebrations if star earned)
    completeMiniGame(result);

    // End spelling session
    endSession();
  };

  const handleEndGameEarly = () => {
    console.log('[SPELLING GAME] Ending game early');
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
          <p className="text-sm text-text-muted mt-2">
            Session: {session ? 'Yes' : 'No'} | Word: {currentWord ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    );
  }

  // Calculate progress based on unique words attempted (excluding current word)
  const completedWordIds = currentWord
    ? new Set(session.wordAttempts.filter(a => a.wordId !== currentWord.id).map(a => a.wordId))
    : new Set(session.wordAttempts.map(a => a.wordId));
  const progress = completedWordIds.size;
  const total = miniGameWords.length;

  return (
    <div
      className="min-h-screen p-4"
      style={{
        background: `linear-gradient(135deg, ${selectedGym.color}10 0%, transparent 100%)`,
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with gym branding and progress */}
        <div className="card border-2" style={{ borderColor: selectedGym.color }}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedGym.emoji}</span>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: selectedGym.color }}>
                  {selectedGym.name}
                </h2>
                <p className="text-sm text-text-muted">
                  Challenge #{selectedMiniGame.order} • Word {progress + 1} of {total}
                </p>
              </div>
            </div>
            <Button variant="error" size="sm" onClick={handleEndGameEarly}>
              End Game
            </Button>
          </div>

          {/* Progress bar with gym color */}
          <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(progress / total) * 100}%`,
                backgroundColor: selectedGym.color,
              }}
            />
          </div>
        </div>

        {/* Show feedback or game interface */}
        {showFeedback ? (
          <Feedback />
        ) : (
          <VoiceInputWhisperOnly
            currentWord={currentWord}
            gymColor={selectedGym.color}
            isPronouncingWord={isPronouncingWord}
          />
        )}
      </div>
    </div>
  );
}
