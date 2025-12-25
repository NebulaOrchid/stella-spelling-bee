import { useState, useEffect } from 'react';
import { SpellingProvider } from './contexts/SpellingContext';
import { GymProvider } from './contexts/GymContext';
import { GameOrchestrator } from './components/GameOrchestrator';
import { GymCardTest } from './components/gym/GymCardTest';
import { loadWords } from './utils/wordLoader';
import type { Word } from './types';

function App() {
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Toggle for test mode - set to true to view GymCardTest page
  const [testMode, setTestMode] = useState(false);

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

  // Test mode - show GymCardTest page
  if (testMode) {
    return (
      <div>
        {/* Toggle button */}
        <button
          onClick={() => setTestMode(false)}
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors"
        >
          Exit Test Mode → Main Game
        </button>
        <GymCardTest />
      </div>
    );
  }

  // Main game
  return (
    <GymProvider allWords={allWords}>
      <SpellingProvider>
        <div>
          {/* Toggle button */}
          <button
            onClick={() => setTestMode(true)}
            className="fixed top-4 right-4 z-50 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-lg transition-colors"
          >
            🔥 Test Gym Card
          </button>
          <GameOrchestrator />
        </div>
      </SpellingProvider>
    </GymProvider>
  );
}

export default App;
