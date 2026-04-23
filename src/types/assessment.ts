export interface CSFFunction {
  fn: string;
  id: string;
  ico: string;
  cats: CSFCategory[];
}

export interface CSFCategory {
  id: string;
  n: string;
  qs: CSFQuestion[];
}

export interface CSFQuestion {
  id: string;
  q: string;
  w: number;
  smart?: string;
}

export interface SmartQuestion extends CSFQuestion {
  relevant: boolean;
  hint: string;
}

export interface Assessment {
  id: number;
  date: string;
  score: number;
  answers: Record<string, number>;
  fnScores: FunctionScore[];
  catScores: CategoryScore[];
  warnings: ValidationWarning[];
  recs: CSFQuestion[];
  orgName: string;
}

export interface FunctionScore {
  fn: string;
  score: number;
}

export interface CategoryScore {
  cat: string;
  fn: string;
  score: number;
}

export interface ValidationWarning {
  type: string;
  msg: string;
}

export const SCORE_LABELS = [
  "Not Implemented",
  "Initial / Ad Hoc",
  "Developing / Defined",
  "Managed / Implemented",
  "Optimized / Adaptive",
] as const;
