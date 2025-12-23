import type { GymProgress, MiniGameResult } from '../types';

/**
 * Check if a badge should be unlocked
 * Badge unlocks when all 3 mini-games have stars
 */
export function checkBadgeUnlock(gymProgress: GymProgress): boolean {
  const starsEarned = gymProgress.miniGames.filter(mg => mg.earnedStar).length;
  return starsEarned === 3;
}

/**
 * Update gym progress after completing a mini-game
 */
export function updateGymProgress(
  gymProgress: GymProgress,
  miniGameResult: MiniGameResult
): GymProgress {
  // Update the specific mini-game progress
  const updatedMiniGames = gymProgress.miniGames.map(mg => {
    if (mg.miniGameId === miniGameResult.miniGameId) {
      return {
        ...mg,
        completed: true,
        earnedStar: miniGameResult.earnedStar,
        bestScore: Math.max(mg.bestScore, miniGameResult.correctWords),
        attempts: mg.attempts + 1,
        lastPlayed: miniGameResult.completedAt,
      };
    }
    return mg;
  });

  // Calculate total stars earned
  const starsEarned = updatedMiniGames.filter(mg => mg.earnedStar).length;

  // Check if badge should be unlocked
  const badgeUnlocked = starsEarned === 3;

  const updatedProgress: GymProgress = {
    ...gymProgress,
    miniGames: updatedMiniGames,
    starsEarned,
    badgeUnlocked,
    completedAt: badgeUnlocked ? Date.now() : gymProgress.completedAt,
  };

  console.log(`[BADGE CALC] Gym ${gymProgress.gymId}:`, {
    starsEarned,
    badgeUnlocked,
    wasJustUnlocked: badgeUnlocked && !gymProgress.badgeUnlocked,
  });

  return updatedProgress;
}

/**
 * Initialize progress for a gym
 */
export function initializeGymProgress(
  gymId: string,
  miniGameIds: string[]
): GymProgress {
  return {
    gymId,
    miniGames: miniGameIds.map(id => ({
      miniGameId: id,
      completed: false,
      earnedStar: false,
      bestScore: 0,
      attempts: 0,
    })),
    badgeUnlocked: false,
    starsEarned: 0,
  };
}
