export interface GeneratedOption {
  text: string;
  icon?: string; /* 可选的 emoji 图标 */
  isRecommended: boolean;
  feedback: string;
}

export interface GeneratedScenario {
  scene: string;
  question: string;
  sceneIcon?: string; /* 情景 emoji 图标 */
  options: GeneratedOption[];
  skillTag: string;
  socialRule: string;
  parentTip: string;
}

export interface GenerationRequest {
  interest: string;
  topic: string;
  difficulty?: string;
  sceneIndex?: number;
}

export interface ApiResponse {
  success: boolean;
  data?: GeneratedScenario;
  demo?: boolean;
  error?: string;
  source?: 'ark' | 'pregen' | 'demo' | 'generic-fallback';
  usedInterest?: string;
  originalInterest?: string;
  totalScenarios?: number;
  sceneIndex?: number;
}
