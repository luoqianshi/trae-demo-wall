export type PigType = 'lean' | 'fat' | 'meatFat';

export type IngredientCategory =
  | 'energy'
  | 'protein'
  | 'fiber'
  | 'mineral'
  | 'amino'
  | 'premix'
  | 'other';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  currentKgPerTon: number;
  moisturePct: number;
  crudeProteinPct: number;
  digestibleEnergyMjKg: number;
  priceCnyPerTon: number;
  minKgPerTon?: number;
  maxKgPerTon?: number;
  enabled: boolean;
}

export type Confidence = 'high' | 'medium' | 'low';

export interface TargetProfile {
  id: string;
  pigType: PigType;
  phase: string;
  weightRangeKg: [number, number];
  cpMinPct: number;
  deMinMjKg: number;
  cpMaxPct?: number;
  moistureMaxPct?: number;
  source: string;
  sourceStatus: 'current' | 'deprecated' | 'derived' | 'reference';
  confidence: Confidence;
  warnings: string[];
}

export type ConstraintStatus = 'ok' | 'low' | 'high';

export interface CurrentAnalysis {
  totalKg: number;
  cpPct: number;
  deMjKg: number;
  moisturePct: number;
  costCnyPerTon: number;
  gaps: {
    cp: number;
    de: number;
    moisture: number | undefined;
  };
}

export interface FormulaResultItem {
  id: string;
  name: string;
  currentKg: number;
  recommendedKg: number;
  deltaKg: number;
  ratio: number;
  costCny: number;
  cpContribution: number;
  deContribution: number;
}

export interface FormulaResult {
  status: 'ok';
  items: FormulaResultItem[];
  totalKg: 1000;
  costCnyPerTon: number;
  cpPct: number;
  deMjKg: number;
  moisturePct: number;
  constraintStatus: { cp: ConstraintStatus; de: ConstraintStatus; moisture: ConstraintStatus };
  currentAnalysis: CurrentAnalysis;
  warnings: string[];
}

export type InfeasibleReasonCode =
  | 'insufficientIngredients'
  | 'missingData'
  | 'protein'
  | 'energy'
  | 'sum'
  | 'bounds'
  | 'solver';

export interface InfeasibleReason {
  code: InfeasibleReasonCode;
  message: string;
  offendingIds?: string[];
}

export interface InfeasibleResult {
  status: 'infeasible';
  reasons: InfeasibleReason[];
}

export type SolveResult = FormulaResult | InfeasibleResult;

export interface SolveInput {
  ingredients: Ingredient[];
  target: TargetProfile;
}

export interface AppState {
  pigType: PigType;
  phaseId: string;
  ingredients: Ingredient[];
  showHeavyPhases: boolean;
}
