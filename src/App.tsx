import { useState, useEffect } from 'react';
import { SpellingProvider } from './contexts/SpellingContext';
import { GymProvider } from './contexts/GymContext';
import { GameOrchestrator } from './components/GameOrchestrator';
import { loadWords } from './utils/wordLoader';
import type { Word } from './types';

function App() {
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load all words on app start
    loadWords()
      .then((words) => {
        console.log(`[APP] Loaded ${words.length} words`);
        setAllWords(words);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('[APP] Error loading words:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading || allWords.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">🐝</div>
          <h1 className="text-4xl font-bold text-primary mb-2">
            Spelling Gym Adventure
          </h1>
          <p className="text-xl text-text-muted">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  // Main game
  return (
    <GymProvider allWords={allWords}>
      <SpellingProvider>
        <GameOrchestrator />
      </SpellingProvider>
    </GymProvider>
  );
}

export default App;
