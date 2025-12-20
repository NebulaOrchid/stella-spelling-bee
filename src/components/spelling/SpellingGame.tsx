import { useEffect, useState } from 'react';
import { useSpelling } from '../../contexts/SpellingContext';
import { loadWords, getRandomWords } from '../../utils/wordLoader';
import { WordDisplay } from './WordDisplay';
import { VoiceInput } from './VoiceInput';
import { LetterInput } from './LetterInput';
import { Feedback } from './Feedback';
import { DifficultySelector } from './DifficultySelector';
import { Button } from '../common/Button';
import type { Word } from '../../types';

export function SpellingGame() {
  const { currentWord, showFeedback, session, startSession, endSession } = useSpelling();
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [pronunciationComplete, setPronunciationComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastSession, setLastSession] = useState<typeof session>(null);

  useEffect(() => {
    // Load words on mount
    loadWords()
      .then((words) => {
        setAllWords(words);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error loading words:', error);
        setIsLoading(false);
      });
  }, []);

  // Reset pronunciation flag when word changes
  useEffect(() => {
    setPronunciationComplete(false);
  }, [currentWord?.id]);

  // Auto-end game when all words are completed
  useEffect(() => {
    if (gameStarted && !currentWord && session && session.wordAttempts.length > 0) {
      handleEndGame();
    }
  }, [gameStarted, currentWord, session]);

  const handleStartGame = (difficulty: 1 | 2 | 3) => {
    // Filter words by exact difficulty level (1 = One Bee, 2 = Two Bees, 3 = Three Bees)
    const words = allWords.filter(word => word.difficulty === difficulty);

    // Select 10 random words from the filtered list
    const selectedWords = getRandomWords(words, 10);
    startSession(selectedWords);
    setGameStarted(true);
  };

  const handleEndGame = () => {
    // Save current session before ending
    if (session) {
      setLastSession(session);
      setShowResults(true);
    }
    endSession();
    setGameStarted(false);
  };

  const handlePlayAgain = () => {
    setShowResults(false);
    setLastSession(null);
  };

  const handlePronunciationComplete = () => {
    setPronunciationComplete(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐝</div>
          <p className="text-xl text-text-muted">Loading words...</p>
        </div>
      </div>
    );
  }

  if (!gameStarted || !currentWord) {
    // Show session results if game just ended
    if (showResults && lastSession && lastSession.wordAttempts.length > 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="card max-w-2xl mx-auto space-y-6 text-center">
            <h1 className="text-5xl font-bold text-primary mb-4">
              Great Job! 🎉
            </h1>

            <div className="p-6 bg-accent/10 rounded-lg border-2 border-accent">
              <h3 className="text-3xl font-bold mb-4">Final Score</h3>
              <p className="text-2xl mb-2">
                {lastSession.totalCorrect} out of {lastSession.wordAttempts.length} correct
              </p>
              <p className="text-lg text-text-muted">
                XP Earned: {lastSession.xpEarned} ⭐
              </p>
            </div>

            <Button variant="primary" size="lg" onClick={handlePlayAgain}>
              Play Again
            </Button>
          </div>
        </div>
      );
    }

    // Show difficulty selector for new game
    return <DifficultySelector onSelectDifficulty={handleStartGame} />;
  }

  const progress = session ? session.wordAttempts.length : 0;
  const total = 10;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with progress */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Word {progress + 1} of {total}</h2>
              <p className="text-sm text-text-muted">
                Score: {session?.totalCorrect || 0} correct
              </p>
            </div>
            <Button variant="error" size="sm" onClick={handleEndGame}>
              End Game
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Show feedback or game interface */}
        {showFeedback ? (
          <Feedback />
        ) : (
          <>
            <WordDisplay word={currentWord} onPronunciationComplete={handlePronunciationComplete} />
            <VoiceInput autoStart={pronunciationComplete} currentWord={currentWord} />
            <LetterInput />
          </>
        )}
      </div>
    </div>
  );
}
