import type { Gym, MiniGame, Word } from '../types';

// 18 Pokemon-inspired gym themes
export const GYM_THEMES = [
  { name: 'Flame Badge', emoji: '🔥', theme: 'Fire', color: '#ef4444' },
  { name: 'Water Badge', emoji: '💧', theme: 'Water', color: '#3b82f6' },
  { name: 'Electric Badge', emoji: '⚡', theme: 'Electric', color: '#eab308' },
  { name: 'Nature Badge', emoji: '🌿', theme: 'Nature', color: '#22c55e' },
  { name: 'Ice Badge', emoji: '❄️', theme: 'Ice', color: '#06b6d4' },
  { name: 'Rock Badge', emoji: '🪨', theme: 'Rock', color: '#92400e' },
  { name: 'Sky Badge', emoji: '☁️', theme: 'Sky', color: '#7dd3fc' },
  { name: 'Shadow Badge', emoji: '🌙', theme: 'Shadow', color: '#9333ea' },
  { name: 'Crystal Badge', emoji: '💎', theme: 'Crystal', color: '#ec4899' },
  { name: 'Desert Badge', emoji: '🏜️', theme: 'Desert', color: '#f97316' },
  { name: 'Ocean Badge', emoji: '🌊', theme: 'Ocean', color: '#14b8a6' },
  { name: 'Forest Badge', emoji: '🌲', theme: 'Forest', color: '#15803d' },
  { name: 'Mountain Badge', emoji: '⛰️', theme: 'Mountain', color: '#6b7280' },
  { name: 'Star Badge', emoji: '⭐', theme: 'Star', color: '#fbbf24' },
  { name: 'Dragon Badge', emoji: '🐉', theme: 'Dragon', color: '#8b5cf6' },
  { name: 'Rainbow Badge', emoji: '🌈', theme: 'Rainbow', color: '#ec4899' },
  { name: 'Thunder Badge', emoji: '🌩️', theme: 'Thunder', color: '#6366f1' },
  { name: 'Master Badge', emoji: '👑', theme: 'Master', color: '#a3a3a3' },
];

// Shuffle array utility
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Distribute 450 words across 18 gyms
 * Each gym gets 25 words with mixed difficulty (8-9 of each difficulty level)
 * Each gym is split into 3 mini-games: 8 words, 8 words, 9 words
 */
export function distributeWordsToGyms(allWords: Word[]): Gym[] {
  // Separate words by difficulty
  const oneBee = allWords.filter(w => w.difficulty === 1);
  const twoBee = allWords.filter(w => w.difficulty === 2);
  const threeBee = allWords.filter(w => w.difficulty === 3);

  console.log(`[GYMS] Distributing words: ${oneBee.length} one-bee, ${twoBee.length} two-bee, ${threeBee.length} three-bee`);

  const gyms: Gym[] = [];

  for (let i = 0; i < 18; i++) {
    const gymTheme = GYM_THEMES[i];
    const gymId = `gym-${String(i + 1).padStart(2, '0')}`;

    // Calculate how many words of each difficulty for this gym
    // Total 25 words: aim for 8-9 of each difficulty
    const oneBeeStart = Math.floor((i * oneBee.length) / 18);
    const oneBeeEnd = Math.floor(((i + 1) * oneBee.length) / 18);
    const oneBeeCount = oneBeeEnd - oneBeeStart;

    const twoBeeStart = Math.floor((i * twoBee.length) / 18);
    const twoBeeEnd = Math.floor(((i + 1) * twoBee.length) / 18);
    const twoBeeCount = twoBeeEnd - twoBeeStart;

    const threeBeeStart = Math.floor((i * threeBee.length) / 18);
    const threeBeeEnd = Math.floor(((i + 1) * threeBee.length) / 18);
    const threeBeeCount = threeBeeEnd - threeBeeStart;

    // Get words for this gym
    const gymWords = [
      ...oneBee.slice(oneBeeStart, oneBeeEnd),
      ...twoBee.slice(twoBeeStart, twoBeeEnd),
      ...threeBee.slice(threeBeeStart, threeBeeEnd),
    ];

    console.log(`[GYMS] Gym ${i + 1} (${gymTheme.name}): ${gymWords.length} words (${oneBeeCount} one-bee, ${twoBeeCount} two-bee, ${threeBeeCount} three-bee)`);

    // Shuffle to mix difficulties
    const shuffledWords = shuffle(gymWords);
    const wordIds = shuffledWords.map(w => w.id);

    // Split into 3 mini-games: 8, 8, 9 words
    const miniGame1Words = wordIds.slice(0, 8);
    const miniGame2Words = wordIds.slice(8, 16);
    const miniGame3Words = wordIds.slice(16, 25);

    const miniGames: MiniGame[] = [
      {
        id: `${gymId}-mg-01`,
        gymId,
        order: 1,
        wordIds: miniGame1Words,
      },
      {
        id: `${gymId}-mg-02`,
        gymId,
        order: 2,
        wordIds: miniGame2Words,
      },
      {
        id: `${gymId}-mg-03`,
        gymId,
        order: 3,
        wordIds: miniGame3Words,
      },
    ];

    const gym: Gym = {
      id: gymId,
      name: gymTheme.name,
      emoji: gymTheme.emoji,
      theme: gymTheme.theme,
      color: gymTheme.color,
      miniGames,
      wordIds,
    };

    gyms.push(gym);
  }

  console.log(`[GYMS] Created ${gyms.length} gyms with ${gyms.reduce((sum, g) => sum + g.wordIds.length, 0)} total words`);

  return gyms;
}

/**
 * Get a specific gym by ID
 */
export function getGymById(gyms: Gym[], gymId: string): Gym | undefined {
  return gyms.find(g => g.id === gymId);
}

/**
 * Get a specific mini-game by ID
 */
export function getMiniGameById(gyms: Gym[], miniGameId: string): MiniGame | undefined {
  for (const gym of gyms) {
    const miniGame = gym.miniGames.find(mg => mg.id === miniGameId);
    if (miniGame) return miniGame;
  }
  return undefined;
}

/**
 * Get all words for a specific mini-game
 */
export function getWordsForMiniGame(allWords: Word[], miniGame: MiniGame): Word[] {
  // Shuffle words each time to keep gameplay fresh
  const words = miniGame.wordIds
    .map(id => allWords.find(w => w.id === id))
    .filter((w): w is Word => w !== undefined);

  return shuffle(words);
}
