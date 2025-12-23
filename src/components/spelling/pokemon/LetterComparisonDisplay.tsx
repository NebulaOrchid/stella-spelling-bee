import { motion } from 'framer-motion';

interface LetterComparisonDisplayProps {
  userSpelling: string;
  correctSpelling: string;
}

/**
 * Visual letter-by-letter comparison for incorrect answers
 *
 * Features:
 * - Shows user's spelling with checkmarks/crosses
 * - Highlights correct letters in green, incorrect in red
 * - Displays correct spelling prominently
 * - Helps visual learning and memory
 */
export function LetterComparisonDisplay({ userSpelling, correctSpelling }: LetterComparisonDisplayProps) {
  const userLetters = userSpelling.toUpperCase().split('');
  const correctLetters = correctSpelling.toUpperCase().split('');

  // Pad shorter array with empty strings for comparison
  const maxLength = Math.max(userLetters.length, correctLetters.length);
  while (userLetters.length < maxLength) userLetters.push('');
  while (correctLetters.length < maxLength) correctLetters.push('');

  return (
    <div className="space-y-6">
      {/* User's attempt */}
      <div>
        <p className="text-sm text-text-muted mb-2">You spelled:</p>
        <div className="flex justify-center items-center gap-2 flex-wrap">
          {userLetters.map((letter, index) => {
            const isCorrect = letter === correctLetters[index] && letter !== '';
            const isEmpty = letter === '';

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Letter card */}
                <div
                  className={`w-10 h-14 sm:w-12 sm:h-16 rounded-lg flex items-center justify-center font-bold text-xl sm:text-2xl shadow-md ${
                    isEmpty
                      ? 'bg-gray-200 text-gray-400'
                      : isCorrect
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {letter || '?'}
                </div>

                {/* Checkmark or cross */}
                {!isEmpty && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-sm">
                    {isCorrect ? '✓' : '✗'}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Correct spelling */}
      <div>
        <p className="text-sm text-text-muted mb-2">Correct spelling:</p>
        <div className="flex justify-center items-center gap-2 flex-wrap">
          {correctLetters.map((letter, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="w-10 h-14 sm:w-12 sm:h-16 rounded-lg flex items-center justify-center font-bold text-xl sm:text-2xl shadow-md bg-blue-500 text-white"
            >
              {letter}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
