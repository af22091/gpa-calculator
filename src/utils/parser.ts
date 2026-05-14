import { GRADE_ALIASES } from '../constants';

export interface ParseResult {
  credits: number;
  gradeIndex: number;
}

/**
 * 複雑なレイアウト（多段組み）に対応した解析ロジック
 */
export const parseTranscriptText = (text: string): ParseResult[] => {
  // 1行に複数の科目が並んでいる場合があるため、スペース等で分割して解析
  const lines = text.split(/\n/);
  const results: ParseResult[] = [];

  // 評価（S, A, B...）の正規表現を作成
  const gradeKeys = Object.keys(GRADE_ALIASES).sort((a, b) => b.length - a.length);
  const gradePattern = gradeKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  
  // 1単位〜4単位程度の数字と評価の組み合わせを探す
  // 例: "2 S", "2単位 A", "A 2" など
  const pairRegex = new RegExp(`(\\d(\\.\\d)?)\\s*(単位|credits|credit)?\\s*(${gradePattern})|(${gradePattern})\\s*(\\d(\\.\\d)?)`, 'gi');

  lines.forEach(line => {
    let match;
    // 1行の中から見つかるだけ繰り返す
    while ((match = pairRegex.exec(line)) !== null) {
      let creditsRaw: string | undefined;
      let gradeRaw: string | undefined;

      if (match[1]) { // "2 S" のパターン
        creditsRaw = match[1];
        gradeRaw = match[4];
      } else if (match[5]) { // "S 2" のパターン
        gradeRaw = match[5];
        creditsRaw = match[6];
      }

      if (creditsRaw && gradeRaw) {
        const credits = parseFloat(creditsRaw);
        const gradeIndex = GRADE_ALIASES[gradeRaw.toUpperCase()];
        
        if (gradeIndex !== undefined && !isNaN(credits)) {
          results.push({ credits, gradeIndex });
        }
      }
    }
  });

  return results;
};

export const aggregateResults = (results: ParseResult[]) => {
  const aggregated: Record<number, number[]> = {};

  results.forEach(res => {
    if (!aggregated[res.credits]) {
      aggregated[res.credits] = [0, 0, 0, 0, 0];
    }
    if (res.gradeIndex < 5) {
      aggregated[res.credits][res.gradeIndex]++;
    }
  });

  return aggregated;
};
