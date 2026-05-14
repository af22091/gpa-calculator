import { GRADE_ALIASES } from '../constants';

export interface ParseResult {
  credits: number;
  gradeIndex: number;
  raw: string; // 読み取った生の文字列
}

export const parseTranscriptText = (text: string): ParseResult[] => {
  // 背景の透かし文字を一時的に除去（判定用）
  const cleanText = text.replace(/SHIBAURA|INSTITUTE|TECHNOLOGY|UNIVERSITY|芝浦工業大学/gi, ' ');
  
  const lines = text.split(/\n/); // オリジナルの行を保持
  const results: ParseResult[] = [];

  const gradeKeys = ['S', 'A', 'B', 'C', 'D', '秀', '優', '良', '可', '不', '不可'];
  const gradePattern = gradeKeys.join('|');
  
  const pairRegex = new RegExp(`(\\d)\\s*[^\\d\\n]{0,3}?\\s*(${gradePattern})`, 'gi');

  lines.forEach(line => {
    // 判定はクリーンなテキストで行うが、表示用にオリジナルの行も参照
    const searchLine = line.replace(/SHIBAURA|INSTITUTE|TECHNOLOGY|UNIVERSITY|芝浦工業大学/gi, ' ');
    
    let match;
    while ((match = pairRegex.exec(searchLine)) !== null) {
      const credits = parseFloat(match[1]);
      const gradeRaw = match[2].toUpperCase();
      const gradeIndex = GRADE_ALIASES[gradeRaw];

      if (gradeIndex !== undefined && [1, 2, 3, 4, 8].includes(credits)) {
        results.push({ 
          credits, 
          gradeIndex,
          raw: match[0].trim() // 見つかったペア（例: "2 S"）
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
