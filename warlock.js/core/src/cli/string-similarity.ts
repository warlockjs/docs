/**
 * String similarity utilities for CLI command suggestions
 * Uses Levenshtein distance algorithm for fuzzy matching
 */

/**
 * Calculate the Levenshtein distance between two strings
 * Lower distance = more similar
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Distance (number of edits required to transform str1 to str2)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const len1 = s1.length;
  const len2 = s2.length;

  // Create matrix
  const matrix: number[][] = Array.from({ length: len1 + 1 }, (_, i) =>
    Array.from({ length: len2 + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Suggestion result with similarity score
 */
export type Suggestion = {
  /** The suggested value */
  value: string;
  /** Distance score (lower = more similar) */
  distance: number;
};

/**
 * Find similar strings from a list
 *
 * @param input - The input string to find matches for
 * @param candidates - List of candidate strings
 * @param maxDistance - Maximum distance to consider (default: 3)
 * @param maxResults - Maximum number of results to return (default: 3)
 * @returns Array of suggestions sorted by similarity
 *
 * @example
 * ```typescript
 * findSimilar("biuld", ["build", "dev", "start", "test"])
 * // Returns: [{ value: "build", distance: 1 }]
 * ```
 */
export function findSimilar(
  input: string,
  candidates: string[],
  maxDistance: number = 3,
  maxResults: number = 3,
): Suggestion[] {
  const results: Suggestion[] = [];

  for (const candidate of candidates) {
    const distance = levenshteinDistance(input, candidate);

    if (distance <= maxDistance && distance > 0) {
      results.push({ value: candidate, distance });
    }
  }

  // Sort by distance (most similar first)
  results.sort((a, b) => a.distance - b.distance);

  return results.slice(0, maxResults);
}

/**
 * Check if a string starts with any of the given prefixes
 * Useful for command name matching
 */
export function startsWithAny(str: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => str.toLowerCase().startsWith(prefix.toLowerCase()));
}
