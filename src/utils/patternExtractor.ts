/**
 * Pattern Extraction Utility
 *
 * Robust extraction of spelling from "word → spell → word" voice pattern.
 * Uses a 3-anchor approach to validate the complete pattern structure.
 */

export interface PatternExtractionResult {
  spelling: string;
  confidence: number;
  isValid: boolean;
  structure: {
    firstWord: { found: boolean; position: number; text: string };
    letters: { found: boolean; positions: number[]; text: string[] };
    secondWord: { found: boolean; position: number; text: string };
  };
  issues: string[];
}

/**
 * Normalize a word for matching
 * - Convert to lowercase
 * - Trim whitespace
 * - Remove punctuation
 */
export function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

/**
 * Tokenize text into individual words/tokens
 */
export function tokenize(text: string): string[] {
  return text
    .split(/[\s\-,._]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

/**
 * Check if a token is a single letter
 */
function isSingleLetter(token: string): boolean {
  const normalized = token.toLowerCase().trim();
  return /^[a-zA-Z]$/.test(normalized);
}

/**
 * Find the index of a word occurrence in tokens array
 * Returns -1 if not found
 */
export function findWordOccurrence(
  tokens: string[],
  word: string,
  startIndex: number = 0
): number {
  const normalizedWord = normalizeWord(word);

  for (let i = startIndex; i < tokens.length; i++) {
    if (normalizeWord(tokens[i]) === normalizedWord) {
      return i;
    }
  }

  return -1;
}

/**
 * Find word with fuzzy matching (handles pronunciation variations)
 */
function findWordFuzzy(
  tokens: string[],
  word: string,
  startIndex: number = 0
): number {
  const normalizedWord = normalizeWord(word);

  for (let i = startIndex; i < tokens.length; i++) {
    const token = normalizeWord(tokens[i]);

    // Exact match
    if (token === normalizedWord) {
      return i;
    }

    // Check if token contains the word or vice versa (handles variations)
    if (token.includes(normalizedWord) || normalizedWord.includes(token)) {
      // Only match if the length difference is small (more lenient now)
      if (Math.abs(token.length - normalizedWord.length) <= 3) {
        return i;
      }
    }

    // Check if they start with the same letters (common pronunciation variation)
    const minLength = Math.min(token.length, normalizedWord.length);
    if (minLength >= 3) {
      // Check if first 60% of letters match
      const matchLength = Math.floor(minLength * 0.6);
      if (token.substring(0, matchLength) === normalizedWord.substring(0, matchLength)) {
        return i;
      }
    }

    // Check for common phonetic similarities
    // Examples: "fisher" vs "fissure", "fishers" vs "fissures"
    if (arePhoneticallySimilar(token, normalizedWord)) {
      return i;
    }
  }

  return -1;
}

/**
 * Check if two words are phonetically similar
 */
function arePhoneticallySimilar(word1: string, word2: string): boolean {
  // If one word is much longer, they're probably not similar
  if (Math.abs(word1.length - word2.length) > 3) {
    return false;
  }

  // Count matching characters (simple Levenshtein-like check)
  let matches = 0;
  const maxLen = Math.max(word1.length, word2.length);

  for (let i = 0; i < Math.min(word1.length, word2.length); i++) {
    if (word1[i] === word2[i]) {
      matches++;
    }
  }

  // If 70% or more characters match in position, consider similar
  return (matches / maxLen) >= 0.7;
}

/**
 * Extract single-letter tokens between two positions
 */
export function extractLettersBetween(
  tokens: string[],
  startIdx: number,
  endIdx: number
): string[] {
  const letters: string[] = [];

  // Extract tokens between start and end (exclusive)
  for (let i = startIdx + 1; i < endIdx; i++) {
    if (isSingleLetter(tokens[i])) {
      letters.push(tokens[i].toUpperCase());
    }
  }

  return letters;
}

/**
 * Calculate confidence score based on pattern structure
 *
 * Scoring:
 * - 100%: Perfect pattern (word → exact letters → word)
 * - 80%: Good pattern (word → correct # letters → word)
 * - 60%: Partial pattern (word → letters → word, wrong count)
 * - 40%: Missing one anchor
 * - 20%: Only letters found
 * - 0%: No valid pattern
 */
export function calculateConfidence(
  result: PatternExtractionResult,
  expectedWord: string
): number {
  const { structure } = result;
  const expectedLength = expectedWord.length;
  const actualLength = structure.letters.text.length;

  // Check if all anchors found
  const hasFirstWord = structure.firstWord.found;
  const hasLetters = structure.letters.found && actualLength > 0;
  const hasSecondWord = structure.secondWord.found;

  // Perfect pattern: all anchors + exact letter count
  if (hasFirstWord && hasLetters && hasSecondWord && actualLength === expectedLength) {
    return 100;
  }

  // Good pattern: all anchors + close letter count
  if (hasFirstWord && hasLetters && hasSecondWord) {
    const letterDifference = Math.abs(actualLength - expectedLength);
    if (letterDifference <= 1) {
      return 90;
    } else if (letterDifference <= 2) {
      return 80;
    } else {
      return 70;
    }
  }

  // Partial pattern: has letters and one anchor
  if (hasLetters && (hasFirstWord || hasSecondWord)) {
    return 50;
  }

  // Only letters found
  if (hasLetters) {
    return 30;
  }

  // No valid pattern
  return 0;
}

/**
 * Validate pattern structure completeness
 */
export function validatePatternStructure(result: PatternExtractionResult): boolean {
  const { structure } = result;

  // Pattern is valid if it has:
  // 1. First word OR second word (at least one anchor)
  // 2. At least some letters detected
  const hasAtLeastOneAnchor = structure.firstWord.found || structure.secondWord.found;
  const hasLetters = structure.letters.found && structure.letters.text.length > 0;

  return hasAtLeastOneAnchor && hasLetters;
}

/**
 * Extract spelling pattern from transcription using 3-anchor approach
 *
 * Algorithm:
 * 1. Tokenize transcription
 * 2. Find first occurrence of expected word
 * 3. Find second occurrence of expected word (after first)
 * 4. Extract single-letter tokens between the two words
 * 5. Validate and score the pattern
 *
 * Returns extraction result with confidence score and validation
 */
export function extractSpellingPattern(
  transcription: string,
  expectedWord: string
): PatternExtractionResult {
  const tokens = tokenize(transcription);
  const issues: string[] = [];

  // Initialize result structure
  const result: PatternExtractionResult = {
    spelling: '',
    confidence: 0,
    isValid: false,
    structure: {
      firstWord: { found: false, position: -1, text: '' },
      letters: { found: false, positions: [], text: [] },
      secondWord: { found: false, position: -1, text: '' },
    },
    issues: [],
  };

  // Find first word occurrence
  let firstWordIdx = findWordOccurrence(tokens, expectedWord);

  // Try fuzzy matching if exact match not found
  if (firstWordIdx === -1) {
    firstWordIdx = findWordFuzzy(tokens, expectedWord);
    if (firstWordIdx !== -1) {
      issues.push('Used fuzzy matching for first word');
    }
  }

  if (firstWordIdx !== -1) {
    result.structure.firstWord = {
      found: true,
      position: firstWordIdx,
      text: tokens[firstWordIdx],
    };
  } else {
    issues.push('First word not found in transcription');
  }

  // Find second word occurrence (after first)
  let secondWordIdx = -1;
  if (firstWordIdx !== -1) {
    secondWordIdx = findWordOccurrence(tokens, expectedWord, firstWordIdx + 1);

    // Try fuzzy matching for second word
    if (secondWordIdx === -1) {
      secondWordIdx = findWordFuzzy(tokens, expectedWord, firstWordIdx + 1);
      if (secondWordIdx !== -1) {
        issues.push('Used fuzzy matching for second word');
      }
    }
  } else {
    // If first word not found, try to find any occurrence
    secondWordIdx = findWordOccurrence(tokens, expectedWord);
    if (secondWordIdx === -1) {
      secondWordIdx = findWordFuzzy(tokens, expectedWord);
    }
  }

  if (secondWordIdx !== -1) {
    result.structure.secondWord = {
      found: true,
      position: secondWordIdx,
      text: tokens[secondWordIdx],
    };
  } else {
    issues.push('Second word not found in transcription');
  }

  // Extract letters between the two words
  if (firstWordIdx !== -1 && secondWordIdx !== -1 && secondWordIdx > firstWordIdx) {
    // Both anchors found - extract letters between them
    const letters = extractLettersBetween(tokens, firstWordIdx, secondWordIdx);

    if (letters.length > 0) {
      result.structure.letters = {
        found: true,
        positions: Array.from({ length: letters.length }, (_, i) => firstWordIdx + 1 + i),
        text: letters,
      };
      result.spelling = letters.join('');
    } else {
      issues.push('No letters found between words');
    }
  } else if (firstWordIdx !== -1 || secondWordIdx !== -1) {
    // Only one anchor found - extract all consecutive letters
    const anchorIdx = firstWordIdx !== -1 ? firstWordIdx : secondWordIdx;
    const letters: string[] = [];

    // Look for letters after the anchor
    for (let i = anchorIdx + 1; i < tokens.length; i++) {
      if (isSingleLetter(tokens[i])) {
        letters.push(tokens[i].toUpperCase());
      } else {
        break; // Stop at first non-letter
      }
    }

    if (letters.length > 0) {
      result.structure.letters = {
        found: true,
        positions: Array.from({ length: letters.length }, (_, i) => anchorIdx + 1 + i),
        text: letters,
      };
      result.spelling = letters.join('');
      issues.push('Only one anchor found - used fallback extraction');
    } else {
      issues.push('No letters found after anchor word');
    }
  } else {
    // No anchors found - extract longest consecutive letter sequence
    let longestSequence: string[] = [];
    let currentSequence: string[] = [];

    for (const token of tokens) {
      if (isSingleLetter(token)) {
        currentSequence.push(token.toUpperCase());
      } else {
        if (currentSequence.length > longestSequence.length) {
          longestSequence = [...currentSequence];
        }
        currentSequence = [];
      }
    }

    // Check last sequence
    if (currentSequence.length > longestSequence.length) {
      longestSequence = [...currentSequence];
    }

    if (longestSequence.length > 0) {
      result.structure.letters = {
        found: true,
        positions: [],
        text: longestSequence,
      };
      result.spelling = longestSequence.join('');
      issues.push('No anchors found - extracted longest letter sequence');
    } else {
      issues.push('No letter sequence found in transcription');
    }
  }

  // Validate and calculate confidence
  result.isValid = validatePatternStructure(result);
  result.confidence = calculateConfidence(result, expectedWord);
  result.issues = issues;

  return result;
}
