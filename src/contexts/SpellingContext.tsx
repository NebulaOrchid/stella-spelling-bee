import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Word, SpellingAttempt, SpellingSession } from '../types';

interface SpellingContextType {
  // Current state
  currentWord: Word | null;
  currentAttempt: string;
  attempts: number;
  session: SpellingSession | null;
  isCorrect: boolean | null;
  showFeedback: boolean;
  firstAttemptCorrect: Map<string, boolean>; // Track if each word was correct on first attempt

  // Actions
  startSession: (words: Word[]) => void;
  setCurrentAttempt: (attempt: string) => void;
  submitAttempt: (spellingToSubmit?: string) => void;
  nextWord: () => void;
  endSession: () => void;
  resetFeedback: () => void;
}

const SpellingContext = createContext<SpellingContextType | undefined>(undefined);

export function SpellingProvider({ children }: { children: React.ReactNode }) {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [session, setSession] = useState<SpellingSession | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [wordQueue, setWordQueue] = useState<Word[]>([]);
  const [attemptStartTime, setAttemptStartTime] = useState<number>(Date.now());
  const [firstAttemptCorrect, setFirstAttemptCorrect] = useState<Map<string, boolean>>(new Map());

  const startSession = useCallback((words: Word[]) => {
    const newSession: SpellingSession = {
      id: uuidv4(),
      startTime: Date.now(),
      wordAttempts: [],
      totalCorrect: 0,
      totalIncorrect: 0,
      xpEarned: 0,
    };

    setSession(newSession);
    setWordQueue(words);
    setCurrentWord(words[0] || null);
    setCurrentAttempt('');
    setAttempts(0);
    setIsCorrect(null);
    setShowFeedback(false);
    setAttemptStartTime(Date.now());
    setFirstAttemptCorrect(new Map()); // Reset first-attempt tracking
  }, []);

  const submitAttempt = useCallback((spellingToSubmit?: string) => {
    if (!currentWord || !session) return;

    // Use provided spelling or fall back to currentAttempt
    const attemptValue = spellingToSubmit !== undefined ? spellingToSubmit : currentAttempt;
    const userSpelling = attemptValue.trim().toLowerCase();
    const correctSpelling = currentWord.word.toLowerCase();
    const correct = userSpelling === correctSpelling;

    // DEBUG: Log the comparison
    console.log('[VALIDATION] Comparing:');
    console.log('  User spelled:', `"${userSpelling}"`, '(length:', userSpelling.length, ')');
    console.log('  Correct word:', `"${correctSpelling}"`, '(length:', correctSpelling.length, ')');
    console.log('  Match:', correct);
    console.log('  User bytes:', Array.from(userSpelling).map(c => c.charCodeAt(0)));
    console.log('  Correct bytes:', Array.from(correctSpelling).map(c => c.charCodeAt(0)));

    setIsCorrect(correct);
    setShowFeedback(true);

    // Track first attempt correctness for star calculation
    if (attempts === 0) {
      setFirstAttemptCorrect(prev => new Map(prev).set(currentWord.id, correct));
    }

    // Create attempt record
    const attempt: SpellingAttempt = {
      id: uuidv4(),
      wordId: currentWord.id,
      word: currentWord.word,
      userSpelling: attemptValue.trim(),
      isCorrect: correct,
      timestamp: Date.now(),
      attempts: attempts + 1,
      timeSpent: Date.now() - attemptStartTime,
    };

    // Update session
    setSession((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        wordAttempts: [...prev.wordAttempts, attempt],
        totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
        totalIncorrect: prev.totalIncorrect + (correct ? 0 : 1),
        xpEarned: prev.xpEarned + (correct ? 10 : 0), // 10 XP per correct word
      };
    });

    setAttempts(attempts + 1);
  }, [currentWord, currentAttempt, session, attempts, attemptStartTime]);

  const nextWord = useCallback(() => {
    setShowFeedback(false);
    setIsCorrect(null);
    setCurrentAttempt('');
    setAttempts(0);

    // Move to next word
    const remainingWords = wordQueue.slice(1);
    setWordQueue(remainingWords);
    setCurrentWord(remainingWords[0] || null);
    setAttemptStartTime(Date.now());
  }, [wordQueue]);

  const endSession = useCallback(() => {
    if (!session) return;

    // Mark session as ended with timestamp
    // const endedSession = {
    //   ...session,
    //   endTime: Date.now(),
    // };

    // Could save endedSession to storage here for history

    // Reset session to null to go back to difficulty selector
    setSession(null);
    setCurrentWord(null);
    setWordQueue([]);
    setCurrentAttempt('');
    setAttempts(0);
    setIsCorrect(null);
    setShowFeedback(false);
  }, [session]);

  const resetFeedback = useCallback(() => {
    setShowFeedback(false);
    setIsCorrect(null);
  }, []);

  const value: SpellingContextType = {
    currentWord,
    currentAttempt,
    attempts,
    session,
    isCorrect,
    showFeedback,
    firstAttemptCorrect,
    startSession,
    setCurrentAttempt,
    submitAttempt,
    nextWord,
    endSession,
    resetFeedback,
  };

  return (
    <SpellingContext.Provider value={value}>{children}</SpellingContext.Provider>
  );
}

export function useSpelling() {
  const context = useContext(SpellingContext);
  if (context === undefined) {
    throw new Error('useSpelling must be used within a SpellingProvider');
  }
  return context;
}
