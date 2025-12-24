import type { SpellingAttempt, MiniGameResult } from '../types';

/**
 * Calculate if a star was earned based on mini-game performance
 * Star is earned if ALL words were spelled correctly on the FIRST attempt
 */
export function calculateMiniGameResult(
  miniGameId: string,
  wordAttempts: SpellingAttempt[]
): MiniGameResult {
  // Group attempts by wordId to find first attempt for each word
  const firstAttempts = new Map<string, SpellingAttempt>();

  wordAttempts.forEach(attempt => {
    if (!firstAttempts.has(attempt.wordId)) {
      firstAttempts.set(attempt.wordId, attempt);
    }
  });

  const totalWords = firstAttempts.size;
  const firstAttemptArray = Array.from(firstAttempts.values());

  // Count how many words were correct on first attempt
  const firstAttemptCorrect = firstAttemptArray.filter(a => a.isCorrect).length;

  // Count total correct words (including retries)
  const allCorrectWords = new Set(
    wordAttempts.filter(a => a.isCorrect).map(a => a.wordId)
  ).size;

  // Find words that were spelled incorrectly (for Wrong Gym)
  // A word is incorrect if it was NEVER spelled correctly
  const incorrectWordIds = firstAttemptArray
    .filter(firstAttempt => {
      // Check if this word was EVER spelled correctly (including retries)
      const wasEventuallyCorrect = wordAttempts.some(
        a => a.wordId === firstAttempt.wordId && a.isCorrect
      );
      return !wasEventuallyCorrect; // Include word if it was never correct
    })
    .map(a => a.wordId);

  // Earn star ONLY if ALL words were correct on first attempt
  const earnedStar = firstAttemptCorrect === totalWords && totalWords > 0;

  console.log(`[STAR CALC] Mini-game ${miniGameId}:`, {
    totalWords,
    firstAttemptCorrect,
    allCorrectWords,
    incorrectWordIds,
    earnedStar,
  });

  return {
    miniGameId,
    totalWords,
    correctWords: allCorrectWords,
    firstAttemptCorrect,
    earnedStar,
    completedAt: Date.now(),
    incorrectWordIds, // Words that were never spelled correctly
  };
}

/**
 * Check if a word was spelled correctly on the first attempt
 */
export function wasCorrectOnFirstAttempt(
  wordId: string,
  wordAttempts: SpellingAttempt[]
): boolean {
  const firstAttempt = wordAttempts.find(a => a.wordId === wordId);
  return firstAttempt?.isCorrect ?? false;
}
