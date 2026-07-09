export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  status: 'draft' | 'analyzing' | 'designing' | 'reviewing' | 'completed';
  requirement?: string;
  analysis?: AnalysisResult;
  prototype?: Prototype;
  chatMessages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'analysis' | 'prototype' | 'flowchart';
  timestamp: string;
  metadata?: Record<string, unknown>;
  bookmarks?: Bookmark[];
}

export interface Bookmark {
  id: string;
  type: 'highlight' | 'knowledge' | 'quote';
  label: string;
  content: string;
  timestamp: string;
}

export interface ExtractedContent {
  id: string;
  title: string;
  content: string;
  type: 'feature' | 'business_rule' | 'knowledge' | 'user_story';
  sourceMessageId: string;
  createdAt: string;
}

export interface FlowchartNode {
  id: string;
  label: string;
  type: 'start' | 'process' | 'decision' | 'end';
  x: number;
  y: number;
}

export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Flowchart {
  id: string;
  name: string;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export interface AnalysisResult {
  id: string;
  features: Feature[];
  userStories: UserStory[];
  businessRules: string[];
  entities: Entity[];
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface UserStory {
  id: string;
  role: string;
  want: string;
  reason: string;
}

export interface Entity {
  id: string;
  name: string;
  attributes: Attribute[];
}

export interface Attribute {
  name: string;
  type: string;
}

export interface Prototype {
  id: string;
  pages: Page[];
  theme: ThemeConfig;
}

export interface Page {
  id: string;
  name: string;
  components: Component[];
}

export interface Component {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  style: React.CSSProperties;
  position: { x: number; y: number };
  children?: Component[];
}

export type ComponentType = 
  | 'button'
  | 'input'
  | 'text'
  | 'card'
  | 'list'
  | 'navigation'
  | 'form'
  | 'modal'
  | 'table'
  | 'chart'
  | 'image'
  | 'dropdown'
  | 'checkbox'
  | 'radio'
  | 'textarea';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
}

export interface Comment {
  id: string;
  content: string;
  position: { x: number; y: number };
  author: string;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export type StatusType = 'draft' | 'analyzing' | 'designing' | 'reviewing' | 'completed';
