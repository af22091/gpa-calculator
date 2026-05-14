import { GRADE_ALIASES } from '../constants';

export interface ParseResult {
  credits: number;
  gradeIndex: number;
  raw: string; // 読み取った生の文字列
}

export const parseTranscriptText = (text: string, mode: 'general' | 'shibaura' = 'general'): ParseResult[] => {
  // 背景の透かし文字やヘッダーを一時的に除去
  const noisePattern = mode === 'shibaura' 
    ? /SHIBAURA|INSTITUTE|TECHNOLOGY|UNIVERSITY|芝浦工業大学|成績証明書|授業科目名|単位|成績/gi
    : /SHIBAURA|INSTITUTE|TECHNOLOGY|UNIVERSITY|芝浦工業大学/gi;

  const cleanText = text.replace(noisePattern, ' ');
  const lines = cleanText.split(/\n/);
  const results: ParseResult[] = [];

  const gradeKeys = ['S', 'A', 'B', 'C', 'D', '秀', '優', '良', '可', '不', '不可'];
  const gradePattern = gradeKeys.join('|');
  
  // 芝浦モードでは縦棒などのノイズを考慮して5文字まで許容する
  const pairRegex = mode === 'shibaura'
    ? new RegExp(`(\\d)\\s*[^\\d\\n]{0,5}?\\s*(${gradePattern})`, 'gi')
    : new RegExp(`(\\d)\\s*[^\\d\\n]{0,3}?\\s*(${gradePattern})`, 'gi');

  lines.forEach(line => {
    let match;
    while ((match = pairRegex.exec(line)) !== null) {
      const credits = parseFloat(match[1]);
      const gradeRaw = match[2].toUpperCase();
      const gradeIndex = GRADE_ALIASES[gradeRaw];

      if (gradeIndex !== undefined && [1, 2, 3, 4, 8].includes(credits)) {
        results.push({ 
          credits, 
          gradeIndex,
          raw: match[0].trim() 
        });
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
