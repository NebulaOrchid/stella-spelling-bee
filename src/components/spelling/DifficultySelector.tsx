import { Button } from '../common/Button';

interface DifficultySelectorProps {
  onSelectDifficulty: (difficulty: 1 | 2 | 3) => void;
}

export function DifficultySelector({ onSelectDifficulty }: DifficultySelectorProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="card text-center space-y-8">
          <div>
            <h1 className="text-5xl font-bold text-primary mb-2">Spelling Bee</h1>
            <p className="text-xl text-text-muted">Choose Your Difficulty Level</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* One Bee - Easy */}
            <button
              onClick={() => onSelectDifficulty(1)}
              className="card hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer p-6 space-y-4"
            >
              <div className="text-6xl">🐝</div>
              <h2 className="text-2xl font-bold text-primary">One Bee</h2>
              <p className="text-sm text-text-muted">Easier words for beginners</p>
              <div className="text-xs text-text-muted">
                150 words
              </div>
            </button>

            {/* Two Bees - Medium */}
            <button
              onClick={() => onSelectDifficulty(2)}
              className="card hover:border-warning hover:shadow-lg transition-all duration-200 cursor-pointer p-6 space-y-4"
            >
              <div className="text-6xl">🐝🐝</div>
              <h2 className="text-2xl font-bold text-warning">Two Bees</h2>
              <p className="text-sm text-text-muted">Medium challenge words</p>
              <div className="text-xs text-text-muted">
                150 words
              </div>
            </button>

            {/* Three Bees - Hard */}
            <button
              onClick={() => onSelectDifficulty(3)}
              className="card hover:border-error hover:shadow-lg transition-all duration-200 cursor-pointer p-6 space-y-4"
            >
              <div className="text-6xl">🐝🐝🐝</div>
              <h2 className="text-2xl font-bold text-error">Three Bees</h2>
              <p className="text-sm text-text-muted">Challenging expert words</p>
              <div className="text-xs text-text-muted">
                150 words
              </div>
            </button>
          </div>

          <div className="text-sm text-text-muted space-y-2 pt-4">
            <p className="font-semibold">How to Play:</p>
            <p>1. Listen to the word</p>
            <p>2. Say the word, then spell it letter by letter</p>
            <p>3. Say the word again and pause for 2 seconds</p>
            <p>4. Your answer will auto-submit!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
