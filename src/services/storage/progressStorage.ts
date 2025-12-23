import type { UserGymProgress, GymProgress, Gym } from '../../types';
import { initializeGymProgress } from '../../utils/badgeCalculator';

const STORAGE_KEY = 'stella-gym-progress';
const STORAGE_VERSION = 1;

interface StoredProgress {
  version: number;
  data: UserGymProgress;
}

/**
 * Progress Storage Service
 * Handles saving and loading gym progress from localStorage
 */
export class ProgressStorage {
  /**
   * Load progress from localStorage
   * Returns initialized progress if none exists
   */
  static loadProgress(gyms: Gym[]): UserGymProgress {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        console.log('[PROGRESS] No saved progress found, initializing new progress');
        return this.initializeProgress(gyms);
      }

      const parsed: StoredProgress = JSON.parse(stored);

      // Check version compatibility
      if (parsed.version !== STORAGE_VERSION) {
        console.log('[PROGRESS] Version mismatch, resetting progress');
        return this.initializeProgress(gyms);
      }

      // Validate that we have progress for all gyms
      if (parsed.data.gyms.length !== gyms.length) {
        console.log('[PROGRESS] Gym count mismatch, merging progress');
        return this.mergeProgress(parsed.data, gyms);
      }

      console.log('[PROGRESS] Loaded existing progress:', {
        totalStars: parsed.data.totalStars,
        totalBadges: parsed.data.totalBadges,
      });

      return parsed.data;
    } catch (error) {
      console.error('[PROGRESS] Error loading progress:', error);
      return this.initializeProgress(gyms);
    }
  }

  /**
   * Save progress to localStorage
   */
  static saveProgress(progress: UserGymProgress): void {
    try {
      const stored: StoredProgress = {
        version: STORAGE_VERSION,
        data: progress,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      console.log('[PROGRESS] Saved progress:', {
        totalStars: progress.totalStars,
        totalBadges: progress.totalBadges,
      });
    } catch (error) {
      console.error('[PROGRESS] Error saving progress:', error);
    }
  }

  /**
   * Initialize fresh progress for all gyms
   */
  static initializeProgress(gyms: Gym[]): UserGymProgress {
    const gymProgress: GymProgress[] = gyms.map(gym =>
      initializeGymProgress(
        gym.id,
        gym.miniGames.map(mg => mg.id)
      )
    );

    return {
      gyms: gymProgress,
      totalStars: 0,
      totalBadges: 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Merge existing progress with new gym structure
   * (In case gyms were added/modified)
   */
  private static mergeProgress(
    existing: UserGymProgress,
    gyms: Gym[]
  ): UserGymProgress {
    const existingMap = new Map(existing.gyms.map(gp => [gp.gymId, gp]));

    const mergedGyms: GymProgress[] = gyms.map(gym => {
      const existingProgress = existingMap.get(gym.id);
      if (existingProgress) {
        return existingProgress;
      }
      return initializeGymProgress(
        gym.id,
        gym.miniGames.map(mg => mg.id)
      );
    });

    // Recalculate totals
    const totalStars = mergedGyms.reduce((sum, gp) => sum + gp.starsEarned, 0);
    const totalBadges = mergedGyms.filter(gp => gp.badgeUnlocked).length;

    return {
      gyms: mergedGyms,
      totalStars,
      totalBadges,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get progress for a specific gym
   */
  static getGymProgress(
    progress: UserGymProgress,
    gymId: string
  ): GymProgress | undefined {
    return progress.gyms.find(gp => gp.gymId === gymId);
  }

  /**
   * Update progress for a specific gym
   */
  static updateGymProgress(
    progress: UserGymProgress,
    updatedGymProgress: GymProgress
  ): UserGymProgress {
    const updatedGyms = progress.gyms.map(gp =>
      gp.gymId === updatedGymProgress.gymId ? updatedGymProgress : gp
    );

    // Recalculate totals
    const totalStars = updatedGyms.reduce((sum, gp) => sum + gp.starsEarned, 0);
    const totalBadges = updatedGyms.filter(gp => gp.badgeUnlocked).length;

    return {
      gyms: updatedGyms,
      totalStars,
      totalBadges,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Reset all progress (for debugging or user request)
   */
  static resetProgress(gyms: Gym[]): UserGymProgress {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[PROGRESS] Progress reset');
    return this.initializeProgress(gyms);
  }
}
