import { GRADE_ALIASES } from '../constants';

export interface ParseResult {
  credits: number;
  gradeIndex: number;
}

/**
 * Parses raw text to find grade and credit pairs.
 * Example input: "Math S 2 credits", "English 秀 1", etc.
 */
export const parseTranscriptText = (text: string): ParseResult[] => {
  const lines = text.split(/\n/);
  const results: ParseResult[] = [];

  // Common patterns for credits: "2", "2単位", "2.0"
  // Common patterns for grades: "S", "秀", "A", "優", etc.
  
  lines.forEach(line => {
    // Look for credits: "2", "2.0", "2単位", "2 credits"
    const creditMatch = line.match(/(\d(\.\d)?)\s*(単位|credits|credit)?/i);
    const credits = creditMatch ? parseFloat(creditMatch[1]) : null;

    // Look for grade aliases (case insensitive, whole word or specific symbols)
    let foundGradeIndex: number | null = null;
    for (const [alias, index] of Object.entries(GRADE_ALIASES)) {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\s|[,:;])${escapedAlias}($|\\s|[,:;])`, 'i');
      if (regex.test(line)) {
        foundGradeIndex = index;
        break;
      }
    }

    if (foundGradeIndex !== null) {
      results.push({ credits: credits || 2, gradeIndex: foundGradeIndex });
    }
  });

  return results;
};

/**
 * Aggregates parse results into a format suitable for the app state.
 * Returns a map of credits to an array of grade counts.
 */
export const aggregateResults = (results: ParseResult[]) => {
  const aggregated: Record<number, number[]> = {};

  results.forEach(res => {
    if (!aggregated[res.credits]) {
      aggregated[res.credits] = [0, 0, 0, 0, 0]; // 5 stages for Pattern 1
    }
    if (res.gradeIndex < 5) {
      aggregated[res.credits][res.gradeIndex]++;
    }
  });

  return aggregated;
};
