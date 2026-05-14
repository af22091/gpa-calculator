import { GRADE_ALIASES } from '../constants';

export interface ParseResult {
  credits: number;
  gradeIndex: number;
}

export const parseTranscriptText = (text: string): ParseResult[] => {
  // 背景の透かし文字を強力に除去
  const cleanText = text.replace(/SHIBAURA|INSTITUTE|TECHNOLOGY|UNIVERSITY|芝浦工業大学/gi, ' ');
  
  const lines = cleanText.split(/\n/);
  const results: ParseResult[] = [];

  // 評価ラベル
  const gradeKeys = ['S', 'A', 'B', 'C', 'D', '秀', '優', '良', '可', '不', '不可'];
  const gradePattern = gradeKeys.join('|');
  
  // 柔軟なペアマッチング: [数字] [任意の文字] [評価]
  // 単位数と評価の間に他の文字が挟まっていても、3文字以内ならペアとみなす
  const pairRegex = new RegExp(`(\\d)\\s*[^\\d\\n]{0,3}?\\s*(${gradePattern})`, 'gi');

  lines.forEach(line => {
    let match;
    while ((match = pairRegex.exec(line)) !== null) {
      const credits = parseFloat(match[1]);
      const gradeRaw = match[2].toUpperCase();
      const gradeIndex = GRADE_ALIASES[gradeRaw];

      if (gradeIndex !== undefined && [1, 2, 3, 4, 8].includes(credits)) {
        results.push({ credits, gradeIndex });
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
