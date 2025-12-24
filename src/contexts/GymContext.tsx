import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Gym, MiniGame, Word, UserGymProgress, MiniGameResult } from '../types';
import { distributeWordsToGyms, getGymById, getMiniGameById, getWordsForMiniGame, updateWrongGym } from '../data/gyms';
import { ProgressStorage } from '../services/storage/progressStorage';
import { updateGymProgress as calculateGymProgress } from '../utils/badgeCalculator';

interface GymContextType {
  // Data
  gyms: Gym[];
  allWords: Word[];
  gymProgress: UserGymProgress;

  // Current state
  selectedGym: Gym | null;
  selectedMiniGame: MiniGame | null;
  miniGameWords: Word[];

  // Celebration state
  showStarCelebration: boolean;
  showBadgeCelebration: boolean;
  celebrationGym: Gym | null;

  // Navigation actions
  selectGym: (gymId: string) => void;
  startMiniGame: (miniGameId: string) => void;
  returnToGymDetail: () => void;
  returnToGymSelection: () => void;

  // Game actions
  completeMiniGame: (result: MiniGameResult) => void;
  dismissCelebration: () => void;

  // Progress actions
  resetAllProgress: () => void;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

interface GymProviderProps {
  children: React.ReactNode;
  allWords: Word[];
}

export function GymProvider({ children, allWords }: GymProviderProps) {
  // Initialize gyms from all words (mutable to allow Wrong Gym updates)
  const [gyms, setGyms] = useState<Gym[]>(() => {
    console.log('[GYM CONTEXT] Initializing gyms from words');
    return distributeWordsToGyms(allWords);
  });

  // Load progress from localStorage
  const [gymProgress, setGymProgress] = useState<UserGymProgress>(() => {
    return ProgressStorage.loadProgress(gyms);
  });

  // Current navigation state
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [selectedMiniGame, setSelectedMiniGame] = useState<MiniGame | null>(null);
  const [miniGameWords, setMiniGameWords] = useState<Word[]>([]);

  // Celebration state
  const [showStarCelebration, setShowStarCelebration] = useState(false);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const [celebrationGym, setCelebrationGym] = useState<Gym | null>(null);

  // Save progress whenever it changes
  useEffect(() => {
    ProgressStorage.saveProgress(gymProgress);
  }, [gymProgress]);

  // Select a gym (navigate to gym detail screen)
  const selectGym = useCallback((gymId: string) => {
    let gym = getGymById(gyms, gymId);
    if (!gym) return;

    // If Wrong Gym, update it with current wrong words
    if (gym.type === 'wrong') {
      console.log('[GYM CONTEXT] Updating Wrong Gym with', gymProgress.wrongWords.length, 'wrong words');
      const updatedWrongGym = updateWrongGym(gym, gymProgress.wrongWords);

      // Update gyms array with the updated Wrong Gym
      setGyms(prevGyms =>
        prevGyms.map(g => g.id === 'gym-wrong' ? updatedWrongGym : g)
      );

      gym = updatedWrongGym;
    }

    console.log('[GYM CONTEXT] Selected gym:', gym.name);
    setSelectedGym(gym);
    setSelectedMiniGame(null);
    setMiniGameWords([]);
  }, [gyms, gymProgress.wrongWords]);

  // Start a mini-game (navigate to spelling game)
  const startMiniGame = useCallback((miniGameId: string) => {
    const miniGame = getMiniGameById(gyms, miniGameId);
    if (miniGame) {
      console.log('[GYM CONTEXT] Starting mini-game:', miniGame.id);
      setSelectedMiniGame(miniGame);

      // Load and shuffle words for this mini-game
      const words = getWordsForMiniGame(allWords, miniGame);
      setMiniGameWords(words);
    }
  }, [gyms, allWords]);

  // Return to gym detail screen (from mini-game)
  const returnToGymDetail = useCallback(() => {
    console.log('[GYM CONTEXT] Returning to gym detail');
    setSelectedMiniGame(null);
    setMiniGameWords([]);
  }, []);

  // Return to gym selection screen (from gym detail)
  const returnToGymSelection = useCallback(() => {
    console.log('[GYM CONTEXT] Returning to gym selection');
    setSelectedGym(null);
    setSelectedMiniGame(null);
    setMiniGameWords([]);
  }, []);

  // Complete a mini-game and update progress
  const completeMiniGame = useCallback((result: MiniGameResult) => {
    if (!selectedGym) return;

    console.log('[GYM CONTEXT] Completing mini-game:', result);

    // Get current gym progress
    const currentGymProgress = ProgressStorage.getGymProgress(gymProgress, selectedGym.id);
    if (!currentGymProgress) return;

    // Check if badge was previously unlocked
    const wasAlreadyUnlocked = currentGymProgress.badgeUnlocked;

    // Update gym progress with mini-game result
    const updatedGymProgress = calculateGymProgress(currentGymProgress, result);

    // Capture wrong words (if not in Wrong Gym itself)
    let updatedWrongWords = [...gymProgress.wrongWords];
    if (selectedGym.type !== 'wrong' && result.incorrectWordIds.length > 0) {
      // Add incorrect words to wrong words list (unique only)
      result.incorrectWordIds.forEach(wordId => {
        if (!updatedWrongWords.includes(wordId)) {
          updatedWrongWords.push(wordId);
          console.log(`[GYM CONTEXT] Added word ${wordId} to Wrong Gym`);
        }
      });
    } else if (selectedGym.type === 'wrong' && result.incorrectWordIds.length === 0) {
      // If in Wrong Gym and all words were spelled correctly, remove them
      // Find which words were in this mini-game and were spelled correctly
      const miniGameWordIds = selectedMiniGame?.wordIds || [];
      const correctedWords = miniGameWordIds.filter(
        wordId => !result.incorrectWordIds.includes(wordId)
      );

      // Remove corrected words from wrong words list
      correctedWords.forEach(wordId => {
        const index = updatedWrongWords.indexOf(wordId);
        if (index > -1) {
          updatedWrongWords.splice(index, 1);
          console.log(`[GYM CONTEXT] Removed corrected word ${wordId} from Wrong Gym`);
        }
      });
    }

    // Update overall progress with wrong words
    const newProgress = {
      ...ProgressStorage.updateGymProgress(gymProgress, updatedGymProgress),
      wrongWords: updatedWrongWords,
    };
    setGymProgress(newProgress);

    // Trigger celebrations
    if (result.earnedStar) {
      console.log('[GYM CONTEXT] Star earned! Triggering celebration');
      setShowStarCelebration(true);
      setCelebrationGym(selectedGym);
    }

    // Check if badge was just unlocked (wasn't unlocked before, but is now)
    if (updatedGymProgress.badgeUnlocked && !wasAlreadyUnlocked) {
      console.log('[GYM CONTEXT] Badge unlocked! Triggering celebration');
      setShowBadgeCelebration(true);
      setCelebrationGym(selectedGym);
    }

    // Return to gym detail after celebrations
    setSelectedMiniGame(null);
    setMiniGameWords([]);
  }, [selectedGym, selectedMiniGame, gymProgress]);

  // Dismiss celebration and continue
  const dismissCelebration = useCallback(() => {
    setShowStarCelebration(false);
    setShowBadgeCelebration(false);
    setCelebrationGym(null);
  }, []);

  // Reset all progress (for debugging or user request)
  const resetAllProgress = useCallback(() => {
    const freshProgress = ProgressStorage.resetProgress(gyms);
    setGymProgress(freshProgress);
    console.log('[GYM CONTEXT] All progress reset');
  }, [gyms]);

  const value: GymContextType = {
    gyms,
    allWords,
    gymProgress,
    selectedGym,
    selectedMiniGame,
    miniGameWords,
    showStarCelebration,
    showBadgeCelebration,
    celebrationGym,
    selectGym,
    startMiniGame,
    returnToGymDetail,
    returnToGymSelection,
    completeMiniGame,
    dismissCelebration,
    resetAllProgress,
  };

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export function useGym() {
  const context = useContext(GymContext);
  if (context === undefined) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
}
