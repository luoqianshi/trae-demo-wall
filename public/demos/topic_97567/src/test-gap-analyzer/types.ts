export interface CodeChange {
  filePath: string;
  changeType: 'added' | 'modified' | 'deleted';
  addedLines: number;
  removedLines: number;
  functions: FunctionInfo[];
  timestamp?: string;
}

export interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  complexity: number;
  parameters: ParameterInfo[];
  returnType?: string;
  isExported: boolean;
  isAsync: boolean;
}

export interface ParameterInfo {
  name: string;
  type?: string;
  isOptional: boolean;
}

export interface TestGap {
  filePath: string;
  functionName?: string;
  gapType: TestGapType;
  severity: Severity;
  description: string;
  suggestedTests: TestSuggestion[];
  riskFactors: string[];
}

export type TestGapType =
  | 'missing_test_file'
  | 'no_coverage_for_logic_path'
  | 'bug_fix_without_test'
  | 'complex_logic_untested'
  | 'boundary_condition_untested'
  | 'edge_case_untested'
  | 'error_handling_untested';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface TestSuggestion {
  testName: string;
  description: string;
  testContent: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface GapAnalysisResult {
  gaps: TestGap[];
  summary: AnalysisSummary;
  timestamp: string;
  analyzedFiles: number;
}

export interface AnalysisSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<TestGapType, number>;
}

export interface TestTemplateContext {
  filePath: string;
  functionInfo?: FunctionInfo;
  gapInfo: TestGap;
  imports: string[];
  mockFunctions: string[];
}
