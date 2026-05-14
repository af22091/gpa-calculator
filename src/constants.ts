export type Pattern = 'pattern1' | 'pattern2';

export type EvaluationPattern = 'set1' | 'set2' | 'set3' | 'set4';

export const EVALUATION_LABELS: Record<EvaluationPattern, string[]> = {
  set1: ['100~90', '89~80', '79~70', '69~60', '59~0'],
  set2: ['秀', '優', '良', '可', '不'],
  set3: ['S', 'A', 'B', 'C', 'DorE'],
  set4: ['A', 'B', 'C', 'D', 'EorF'],
};

export const PATTERN1_POINTS = [4, 3, 2, 1, 0];

export const PATTERN2_POINTS: Record<number, number> = {
  9: 4,
  8: 3.8,
  7: 3.3,
  6: 3,
  5: 2.3,
  4: 2,
  3: 1.3,
  2: 1,
  1: 0.7,
  0: 0,
};

export const GRADE_ALIASES: Record<string, number> = {
  'S': 0, '秀': 0, '100': 0, '95': 0, '90': 0,
  'A': 1, '優': 1, '85': 1, '80': 1,
  'B': 2, '良': 2, '75': 2, '70': 2,
  'C': 3, '可': 3, '65': 3, '60': 3,
  'D': 4, '不可': 4, '不': 4, 'E': 4, 'F': 4, '0': 4, '50': 4,
  '落単': 4, '欠席': 4,
};
