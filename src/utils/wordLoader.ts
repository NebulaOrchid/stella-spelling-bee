import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import type { Word } from '../types';
import wordsCSV from '../data/words.csv?raw';

/**
 * Load words from CSV file
 * Uses Papa Parse to parse the CSV data
 */
export async function loadWords(): Promise<Word[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(wordsCSV, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const words: Word[] = results.data.map((row: any) => ({
          id: uuidv4(),
          word: row.word?.trim() || '',
          difficulty: parseInt(row.difficulty) || 1,
          category: row.category?.trim(),
          definition: row.definition?.trim(),
          sentence: row.sentence?.trim(),
        }));

        resolve(words);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

/**
 * Get words filtered by difficulty range
 */
export function getWordsByDifficulty(
  words: Word[],
  minDifficulty: number,
  maxDifficulty: number
): Word[] {
  return words.filter(
    (word) => word.difficulty >= minDifficulty && word.difficulty <= maxDifficulty
  );
}

/**
 * Get random words from a list
 */
export function getRandomWords(words: Word[], count: number): Word[] {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get words by category
 */
export function getWordsByCategory(words: Word[], category: string): Word[] {
  return words.filter((word) => word.category === category);
}
