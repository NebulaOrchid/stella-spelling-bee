import type { Gym, MiniGame, Word } from '../types';

// 18 Pokemon-type gym themes + 1 Wrong Gym
export const GYM_THEMES = [
  { name: 'Flame Badge', emoji: '🔥', imageUrl: '/images/gyms/fire-gym.png', rewardVideoUrl: '/videos/gyms/fire-gym-reward.mp4', theme: 'Fire', color: '#ef4444' },
  { name: 'Cascade Badge', emoji: '💧', imageUrl: '/images/gyms/water-gym.png', rewardVideoUrl: '/videos/gyms/water-gym-reward.mp4', theme: 'Water', color: '#3b82f6' },
  { name: 'Thunder Badge', emoji: '⚡', imageUrl: '/images/gyms/electric-gym.png', theme: 'Electric', color: '#eab308' },
  { name: 'Rainbow Badge', emoji: '🌿', imageUrl: '/images/gyms/grass-gym.png', rewardVideoUrl: '/videos/gyms/grass-gym-reward.mp4', theme: 'Grass', color: '#22c55e' },
  { name: 'Glacier Badge', emoji: '❄️', imageUrl: '/images/gyms/ice-gym.png', theme: 'Ice', color: '#06b6d4' },
  { name: 'Boulder Badge', emoji: '🪨', imageUrl: '/images/gyms/rock-gym.png', theme: 'Rock', color: '#92400e' },
  { name: 'Zephyr Badge', emoji: '🦅', imageUrl: '/images/gyms/flying-gym.png', theme: 'Flying', color: '#7dd3fc' },
  { name: 'Fog Badge', emoji: '👻', imageUrl: '/images/gyms/ghost-gym.png', theme: 'Ghost', color: '#9333ea' },
  { name: 'Rising Badge', emoji: '🐉', imageUrl: '/images/gyms/dragon-gym.png', theme: 'Dragon', color: '#8b5cf6' },
  { name: 'Toxic Badge', emoji: '☠️', imageUrl: '/images/gyms/poison-gym.png', theme: 'Poison', color: '#a855f7' },
  { name: 'Earth Badge', emoji: '⛰️', imageUrl: '/images/gyms/ground-gym.png', theme: 'Ground', color: '#d97706' },
  { name: 'Marsh Badge', emoji: '🔮', imageUrl: '/images/gyms/psychic-gym.png', theme: 'Psychic', color: '#ec4899' },
  { name: 'Hive Badge', emoji: '🐛', imageUrl: '/images/gyms/bug-gym.png', theme: 'Bug', color: '#84cc16' },
  { name: 'Plain Badge', emoji: '⭐', imageUrl: '/images/gyms/normal-gym.png', theme: 'Normal', color: '#a3a3a3' },
  { name: 'Knuckle Badge', emoji: '🥊', imageUrl: '/images/gyms/fighting-gym.png', theme: 'Fighting', color: '#dc2626' },
  { name: 'Iron Badge', emoji: '⚙️', imageUrl: '/images/gyms/steel-gym.png', theme: 'Steel', color: '#71717a' },
  { name: 'Eclipse Badge', emoji: '🌙', imageUrl: '/images/gyms/dark-gym.png', rewardVideoUrl: '/videos/gyms/dark-gym-reward.mp4', theme: 'Dark', color: '#1f2937' },
  { name: 'Fairy Badge', emoji: '🧚', imageUrl: '/images/gyms/fairy-gym.png', theme: 'Fairy', color: '#f9a8d4' },
];

// Special Wrong Gym theme (19th gym)
export const WRONG_GYM_THEME = {
  name: 'Wrong Gym',
  emoji: '🔄', // Ditto emoji (using retry/transform symbol)
  imageUrl: '/images/gyms/wrong-gym.png',
  theme: 'Wrong',
  color: '#ef4444', // Red for incorrect/wrong
};

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
  // Separate words by difficulty (NO shuffle - keep consistent distribution)
  const oneBee = allWords.filter(w => w.difficulty === 1);
  const twoBee = allWords.filter(w => w.difficulty === 2);
  const threeBee = allWords.filter(w => w.difficulty === 3);

  console.log(`[GYMS] Distributing words: ${oneBee.length} one-bee, ${twoBee.length} two-bee, ${threeBee.length} three-bee`);

  // Calculate exact distribution: 150 words / 18 gyms = 8.33...
  // So: 12 gyms get 8 words, 6 gyms get 9 words (for each difficulty)
  // 12*8 + 6*9 = 96 + 54 = 150 ✓

  const gyms: Gym[] = [];
  let oneBeeIndex = 0;
  let twoBeeIndex = 0;
  let threeBeeIndex = 0;

  for (let i = 0; i < 18; i++) {
    const gymTheme = GYM_THEMES[i];
    const gymId = `gym-${String(i + 1).padStart(2, '0')}`;

    // Determine how many words of each difficulty for this gym
    // First 6 gyms get 9 of each, remaining 12 get 8 of each
    const wordsPerDifficulty = i < 6 ? 9 : 8;

    // Get words for this gym (maintaining balanced difficulty)
    const gymOneBee = oneBee.slice(oneBeeIndex, oneBeeIndex + wordsPerDifficulty);
    const gymTwoBee = twoBee.slice(twoBeeIndex, twoBeeIndex + wordsPerDifficulty);
    const gymThreeBee = threeBee.slice(threeBeeIndex, threeBeeIndex + wordsPerDifficulty);

    oneBeeIndex += wordsPerDifficulty;
    twoBeeIndex += wordsPerDifficulty;
    threeBeeIndex += wordsPerDifficulty;

    const totalGymWords = gymOneBee.length + gymTwoBee.length + gymThreeBee.length;

    console.log(`[GYMS] Gym ${i + 1} (${gymTheme.name}): ${totalGymWords} words (${gymOneBee.length} one-bee, ${gymTwoBee.length} two-bee, ${gymThreeBee.length} three-bee)`);

    // Split into 3 mini-games with balanced difficulty in each
    // Strategy: Distribute each difficulty level evenly across the 3 mini-games
    const miniGame1Words: string[] = [];
    const miniGame2Words: string[] = [];
    const miniGame3Words: string[] = [];

    // Distribute one-bee words across mini-games (round-robin)
    gymOneBee.forEach((word, idx) => {
      if (idx % 3 === 0) miniGame1Words.push(word.id);
      else if (idx % 3 === 1) miniGame2Words.push(word.id);
      else miniGame3Words.push(word.id);
    });

    // Distribute two-bee words across mini-games (round-robin)
    gymTwoBee.forEach((word, idx) => {
      if (idx % 3 === 0) miniGame1Words.push(word.id);
      else if (idx % 3 === 1) miniGame2Words.push(word.id);
      else miniGame3Words.push(word.id);
    });

    // Distribute three-bee words across mini-games (round-robin)
    gymThreeBee.forEach((word, idx) => {
      if (idx % 3 === 0) miniGame1Words.push(word.id);
      else if (idx % 3 === 1) miniGame2Words.push(word.id);
      else miniGame3Words.push(word.id);
    });

    // Keep mini-game words consistent (NO shuffle here - shuffled during gameplay)
    console.log(`[GYMS] Gym ${i + 1} mini-games: MG1=${miniGame1Words.length}, MG2=${miniGame2Words.length}, MG3=${miniGame3Words.length}`);

    // VALIDATION: Count difficulty levels in each mini-game
    const validateMiniGame = (wordIds: string[], mgName: string) => {
      const difficulties = wordIds.map(id => {
        const word = allWords.find(w => w.id === id);
        return word?.difficulty || 0;
      });
      const oneBeeCount = difficulties.filter(d => d === 1).length;
      const twoBeeCount = difficulties.filter(d => d === 2).length;
      const threeBeeCount = difficulties.filter(d => d === 3).length;
      console.log(`[GYMS VALIDATION] Gym ${i + 1} ${mgName}: ${oneBeeCount} one-bee, ${twoBeeCount} two-bee, ${threeBeeCount} three-bee`);
    };

    validateMiniGame(miniGame1Words, 'MG1');
    validateMiniGame(miniGame2Words, 'MG2');
    validateMiniGame(miniGame3Words, 'MG3');

    // Map gym index to mini-game image URLs
    const getMiniGameImage = (gymIndex: number, order: number): string | undefined => {
      const gymTypes = [
        'fire', 'water', 'electric', 'grass', 'ice', 'stone', 'flying', 'ghost',
        'dragon', 'poison', 'ground', 'psychic', 'bug', 'normal', 'fighting',
        'steel', 'dark', 'fairy'
      ];

      if (gymIndex >= 0 && gymIndex < 18) {
        return `/images/gyms/${gymTypes[gymIndex]}-mg-${order}.png`;
      }
      return undefined;
    };

    const miniGames: MiniGame[] = [
      {
        id: `${gymId}-mg-01`,
        gymId,
        order: 1,
        wordIds: miniGame1Words,
        imageUrl: getMiniGameImage(i, 1),
      },
      {
        id: `${gymId}-mg-02`,
        gymId,
        order: 2,
        wordIds: miniGame2Words,
        imageUrl: getMiniGameImage(i, 2),
      },
      {
        id: `${gymId}-mg-03`,
        gymId,
        order: 3,
        wordIds: miniGame3Words,
        imageUrl: getMiniGameImage(i, 3),
      },
    ];

    const wordIds = [...miniGame1Words, ...miniGame2Words, ...miniGame3Words];

    const gym: Gym = {
      id: gymId,
      name: gymTheme.name,
      emoji: gymTheme.emoji,
      imageUrl: (gymTheme as any).imageUrl, // Optional image URL (if provided in theme)
      rewardVideoUrl: (gymTheme as any).rewardVideoUrl, // Optional reward video URL (if provided in theme)
      theme: gymTheme.theme,
      color: gymTheme.color,
      miniGames,
      wordIds,
    };

    gyms.push(gym);
  }

  // Add Wrong Gym (19th gym) - dynamically populated with incorrect words
  const wrongGym: Gym = {
    id: 'gym-wrong',
    name: WRONG_GYM_THEME.name,
    emoji: WRONG_GYM_THEME.emoji,
    imageUrl: (WRONG_GYM_THEME as any).imageUrl,
    theme: WRONG_GYM_THEME.theme,
    color: WRONG_GYM_THEME.color,
    type: 'wrong',
    miniGames: [
      { id: 'gym-wrong-mg-01', gymId: 'gym-wrong', order: 1, wordIds: [] },
      { id: 'gym-wrong-mg-02', gymId: 'gym-wrong', order: 2, wordIds: [] },
      { id: 'gym-wrong-mg-03', gymId: 'gym-wrong', order: 3, wordIds: [] },
    ],
    wordIds: [], // Populated dynamically from user's wrong words
  };

  gyms.push(wrongGym);

  console.log(`[GYMS] Created ${gyms.length} gyms (18 normal + 1 Wrong Gym) with ${gyms.reduce((sum, g) => sum + g.wordIds.length, 0)} total words`);

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

/**
 * Generate dynamic mini-games for Wrong Gym based on wrong words
 * Only creates mini-games that have words (no empty mini-games)
 * - 0 words: No mini-games
 * - 1-5 words: 1 mini-game
 * - 6-10 words: 2 mini-games (5 + remaining)
 * - 11-15 words: 3 mini-games (5 + 5 + remaining)
 */
export function generateWrongGymMiniGames(wrongWordIds: string[]): MiniGame[] {
  const miniGames: MiniGame[] = [];

  // Only create mini-games that have words
  if (wrongWordIds.length > 0) {
    // Mini-game 1: first 5 words (or all if less than 5)
    miniGames.push({
      id: 'gym-wrong-mg-01',
      gymId: 'gym-wrong',
      order: 1,
      wordIds: wrongWordIds.slice(0, 5),
    });
  }

  if (wrongWordIds.length > 5) {
    // Mini-game 2: next 5 words (or remaining if less than 5)
    miniGames.push({
      id: 'gym-wrong-mg-02',
      gymId: 'gym-wrong',
      order: 2,
      wordIds: wrongWordIds.slice(5, 10),
    });
  }

  if (wrongWordIds.length > 10) {
    // Mini-game 3: next 5 words (or remaining if less than 5)
    miniGames.push({
      id: 'gym-wrong-mg-03',
      gymId: 'gym-wrong',
      order: 3,
      wordIds: wrongWordIds.slice(10, 15),
    });
  }

  console.log(`[GYMS] Generated ${miniGames.length} Wrong Gym mini-games from ${wrongWordIds.length} wrong words`);

  return miniGames;
}

/**
 * Update Wrong Gym with current wrong words
 * Returns updated gym with dynamic mini-games populated
 */
export function updateWrongGym(gym: Gym, wrongWordIds: string[]): Gym {
  if (gym.type !== 'wrong') {
    console.warn('[GYMS] Attempted to update non-Wrong gym as Wrong Gym');
    return gym;
  }

  const miniGames = generateWrongGymMiniGames(wrongWordIds);

  return {
    ...gym,
    wordIds: wrongWordIds,
    miniGames,
  };
}
