import { GRADE_ALIASES } from '../constants';

export interface ParseResult {
  credits: number;
  gradeIndex: number;
}

export const parseTranscriptText = (text: string): ParseResult[] => {
  const lines = text.split(/\n/);
  const results: ParseResult[] = [];

  // 単一の文字（S, A, B, C）や特定の漢字（秀, 優...）を独立した単語として探す
  // 背景の "SHIBAURA" などの単語内にある文字は無視する
  const gradeKeys = ['S', 'A', 'B', 'C', 'D', '秀', '優', '良', '可', '不', '不可'];
  const gradePattern = gradeKeys.join('|');
  
  // 単位数(1-4) と 評価 のペアを探す
  // 芝浦工大の形式: "科目名 [単位数] [評価]" の並びを重視
  // 単位数と評価の間に多少のノイズやスペースがあっても許容する
  const pairRegex = new RegExp(`(?:^|\\s|[^A-Z])(\\d(?:\\.0)?)\\s*(?:単位|credits|credit)?\\s+(${gradePattern})(?:$|\\s|[^A-Z])`, 'gi');

  lines.forEach(line => {
    // ノイズ除去: 明らかに背景透かしと思われる単語を一時的に置換
    const cleanLine = line.replace(/SHIBAURA/gi, ' ');
    
    let match;
    while ((match = pairRegex.exec(cleanLine)) !== null) {
      const creditsRaw = match[1];
      const gradeRaw = match[2];

      if (creditsRaw && gradeRaw) {
        const credits = parseFloat(creditsRaw);
        const gradeIndex = GRADE_ALIASES[gradeRaw.toUpperCase()];
        
        // 単位数が 1, 2, 3, 4, 8 のいずれかである可能性が高い（大学の標準）
        if (gradeIndex !== undefined && [1, 2, 3, 4, 8].includes(credits)) {
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
