// Core domain types for the spelling bee app

export interface Word {
  id: string;
  word: string;
  difficulty: number; // 1-10 scale
  category?: string;
  definition?: string;
  sentence?: string; // Example sentence
}

export interface SpellingAttempt {
  id: string;
  wordId: string;
  word: string;
  userSpelling: string;
  isCorrect: boolean;
  timestamp: number;
  attempts: number; // How many tries it took
  timeSpent: number; // Milliseconds
}

export interface SpellingSession {
  id: string;
  startTime: number;
  endTime?: number;
  wordAttempts: SpellingAttempt[];
  totalCorrect: number;
  totalIncorrect: number;
  xpEarned: number; // For future gamification
}

export interface UserProgress {
  totalWords: number;
  correctWords: number;
  totalXP: number;
  currentLevel: number;
  streak: number; // Consecutive days
  lastPracticeDate: string; // ISO date string
  masteredWords: string[]; // Word IDs
}

export interface UserSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0-1
  speechSpeed: number; // 0.5-2.0 for TTS
  voiceType: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'; // OpenAI TTS voices
  theme: 'default' | 'custom'; // For future theming
}

// API Response types
export interface TTSResponse {
  audioUrl: string;
  duration?: number;
}

export interface WhisperResponse {
  text: string;
  confidence?: number;
}

// Storage interface for abstraction
export interface IStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Sound interface for abstraction
export interface ISound {
  playWord(audioUrl: string): Promise<void>;
  playEffect(effectName: SoundEffect): Promise<void>;
  setVolume(volume: number): void;
  stop(): void;
}

export type SoundEffect =
  | 'correct'
  | 'incorrect'
  | 'celebration'
  | 'click'
  | 'whoosh'
  | 'star-earned'
  | 'badge-unlock'
  | 'mini-game-start'
  | 'mini-game-complete'
  | 'gym-select';

// Gym Adventure types
export interface MiniGame {
  id: string;
  gymId: string;
  order: 1 | 2 | 3;
  wordIds: string[];
}

export interface Gym {
  id: string;
  name: string;
  emoji: string;
  theme: string;
  color: string;
  miniGames: MiniGame[];
  wordIds: string[]; // All 25 word IDs for this gym (empty for Wrong Gym - dynamically populated)
  type?: 'normal' | 'wrong'; // 'wrong' for the special Wrong Gym that tracks incorrect words
}

export interface MiniGameProgress {
  miniGameId: string;
  completed: boolean;
  earnedStar: boolean;
  bestScore: number;
  attempts: number;
  lastPlayed?: number;
}

export interface GymProgress {
  gymId: string;
  miniGames: MiniGameProgress[];
  badgeUnlocked: boolean;
  starsEarned: number; // 0-3
  completedAt?: number;
}

export interface UserGymProgress {
  gyms: GymProgress[];
  totalStars: number;
  totalBadges: number;
  lastUpdated: number;
  wrongWords: string[]; // Word IDs of incorrectly spelled words (unique, for Wrong Gym)
}

export interface MiniGameResult {
  miniGameId: string;
  totalWords: number;
  correctWords: number;
  firstAttemptCorrect: number;
  earnedStar: boolean;
  completedAt: number;
  incorrectWordIds: string[]; // Word IDs that were spelled incorrectly (for Wrong Gym)
}
