export interface DataSource {
  platform: string;
  platformIcon: string;
  platformType: 'social' | 'video' | 'news' | 'developer' | 'ecommerce' | 'blog' | 'forum' | 'live' | 'search';
  url: string;
  postDate: string;
  author: string;
  engagement: {
    comments: number;
    likes: number;
    shares: number;
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  excerpt: string;
}

export interface SourceDistribution {
  type: string;
  typeLabel: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ImplementationStep {
  phase: 'validation' | 'mvp' | 'growth';
  phaseName: string;
  duration: string;
  steps: StepDetail[];
}

export interface StepDetail {
  number: number;
  title: string;
  description: string;
  tools: ToolInfo[];
  resources: string[];
}

export interface ToolInfo {
  name: string;
  type: string;
  url: string;
  cost: string;
  description: string;
}

export interface MarketDetail {
  size: 'small' | 'medium' | 'large';
  sizeDescription: string;
  targetUsers: string[];
  demographics: {
    ageRange: string;
    location: string[];
    incomeLevel: string[];
  };
  growthRate: number;
  marketValue: string;
  keyStatistics: Statistic[];
}

export interface Statistic {
  label: string;
  value: string;
  unit: string;
  source: string;
}

export interface MonetizationDetail {
  strategies: MonetizationStrategy[];
  pricingModel: PricingModel;
  expectedRevenue: RevenueProjection;
}

export interface MonetizationStrategy {
  name: string;
  description: string;
  implementationSteps: string[];
  tools: ToolInfo[];
  expectedConversion: string;
  pros: string[];
  cons: string[];
}

export interface PricingModel {
  tiers: Tier[];
  recommendedTier: string;
}

export interface Tier {
  name: string;
  price: string;
  features: string[];
  targetUsers: string;
}

export interface RevenueProjection {
  month1: string;
  month3: string;
  month6: string;
  month12: string;
  assumptions: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  painLevel: number;
  competitionLevel: number;
  competitionLabel: 'low' | 'medium' | 'high';
  validationScore: number;
  potential: 'low' | 'medium' | 'high' | 'very_high';
  category: string;
  tags: string[];
  mentions: number;
  createdAt: string;
  dataSources: DataSource[];
  sourceDistribution: SourceDistribution[];
  implementationSteps: ImplementationStep[];
  marketDetail: MarketDetail;
  monetizationDetail: MonetizationDetail;
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  createdAt: string;
}

export interface Trend {
  id: string;
  title: string;
  category: string;
  growthRate: number;
  volume: number;
  startDate: string;
  keywords: string[];
}

export interface IdeaValidation {
  idea: string;
  validationScore: number;
  competitionAnalysis: {
    existingSolutions: number;
    avgRating: number;
    gaps: string[];
  };
  marketSize: 'small' | 'medium' | 'large';
  mvpFeasibility: number;
  suggestedFeatures: string[];
  monetizationStrategy: string[];
}

export interface Report {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export type TabType = 'opportunities' | 'trends' | 'validator' | 'reports';

export type ViewMode = 'card' | 'detail';
