/**
 * EchoLife Shared Domain Interfaces
 * Core domain models shared between frontend and backend
 */
import { MemoryType, MemoryVisibility, AgentType, EntityType } from './enums';

/** Authenticated user context (from JWT) */
export interface AuthUser {
  userId: string;
  email: string;
  roles: string[];
  subscriptionTier: string;
}

/** User profile data */
export interface UserProfile {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
  birthDate?: string;
  gender?: string;
  location?: string;
  occupation?: string;
  createdAt: string;
  updatedAt: string;
}

/** Memory entity */
export interface Memory {
  id: string;
  userId: string;
  interviewId?: string;
  title: string;
  content: string;
  type: MemoryType;
  visibility: MemoryVisibility;
  emotion?: string;
  emotionScore?: number;
  importance?: number;
  occurredAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Memory with embedding similarity score (for RAG) */
export interface MemoryWithScore extends Memory {
  similarityScore: number;
  recencyScore: number;
  emotionScore: number;
  finalScore: number;
}

/** Interview session */
export interface Interview {
  id: string;
  userId: string;
  title: string;
  status: string;
  memoryCount: number;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

/** Interview message */
export interface InterviewMessage {
  id: string;
  interviewId: string;
  sender: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/** Life tree node */
export interface LifeTreeNode {
  id: string;
  userId: string;
  parentId?: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  memoryCount: number;
  children?: LifeTreeNode[];
  createdAt: string;
}

/** Personality profile (Big Five dimensions) */
export interface PersonalityProfile {
  id: string;
  userId: string;
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  traits?: Record<string, unknown>;
  analysis?: string;
  createdAt: string;
}

/** AI Agent input */
export interface AgentInput {
  userId: string;
  message: string;
  interviewId?: string;
  context?: {
    memories?: Memory[];
    recentMessages?: InterviewMessage[];
    personality?: PersonalityProfile;
  };
}

/** AI Agent output */
export interface AgentOutput {
  response: string;
  entities?: ExtractedEntity[];
  emotion?: string;
  emotionIntensity?: number;
  extractedMemories?: ExtractedMemory[];
  nextQuestion?: string;
}

/** Extracted entity from knowledge agent */
export interface ExtractedEntity {
  name: string;
  type: EntityType;
  description?: string;
  properties?: Record<string, unknown>;
}

/** Extracted memory from story agent */
export interface ExtractedMemory {
  title: string;
  content: string;
  type: MemoryType;
  emotion?: string;
  emotionScore?: number;
  importance?: number;
  occurredAt?: string;
  entities?: ExtractedEntity[];
}

/** RAG retrieval config */
export interface RetrievalConfig {
  topK: number;
  userId: string;
  weightConfig: {
    semantic: number;
    recency: number;
    emotion: number;
  };
  minSimilarity?: number;
  memoryTypes?: MemoryType[];
}

/** RAG retrieval result */
export interface RetrievalResult {
  memories: MemoryWithScore[];
  totalFound: number;
  queryEmbedding?: number[];
}

/** AI call log */
export interface AICallLog {
  id: string;
  userId: string;
  agentType: AgentType;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

/** Time capsule */
export interface TimeCapsule {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  status: string;
  sealedAt: string;
  openAt: string;
  openedAt?: string;
  createdAt: string;
}

/** Family group */
export interface Family {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  memberCount: number;
  createdAt: string;
}

/** Family memory (shared) */
export interface FamilyMemory {
  id: string;
  familyId: string;
  memoryId: string;
  contributorId: string;
  confirmationStatus: string;
  createdAt: string;
}

/** Summary report */
export interface Summary {
  id: string;
  userId: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  title: string;
  content: string;
  highlights?: string[];
  emotionTrend?: Record<string, number>;
  createdAt: string;
}

/** Notification */
export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}
