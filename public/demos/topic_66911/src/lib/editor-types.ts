// ============ Document Types ============

export interface Document {
  id: string
  userId: string
  planId: string | null
  title: string
  content: string
  plainText: string
  wordCount: number
  fileName: string | null
  status: 'draft' | 'review' | 'final'
  createdAt: string
  updatedAt: string
}

export interface CreateDocumentInput {
  title?: string
  content?: string
  planId?: string | null
}

export interface UpdateDocumentInput {
  title?: string
  content?: string
  status?: 'draft' | 'review' | 'final'
}

// ============ AI Types ============

export interface AISuggestion {
  suggestions: string[]
  category: 'introduction' | 'methodology' | 'conclusion' | 'literature' | 'discussion' | 'general'
  context: string
}

export interface AIAnalysis {
  wordCount: number
  paragraphCount: number
  chapterCount: number
  sectionCount: number
  chapters: string[]
  sections: string[]
  structure: {
    hasAbstract: boolean
    hasKeywords: boolean
    hasReferences: boolean
    hasConclusion: boolean
  }
  planSuggestions: string[]
  overallScore: number
}

export interface PlanCheckResult {
  documentId: string
  planId: string | null
  tasks: {
    taskId: string
    title: string
    targetWords: number
    completed: boolean
    matchScore: number
    status: 'completed' | 'in_progress' | 'not_started'
  }[]
  summary: {
    total: number
    completed: number
    inProgress: number
    notStarted: number
    progress: number
  }
  suggestions: string[]
}

// ============ AI Provider Types ============

export type AIProvider = 'ollama' | 'deepseek' | 'openai' | 'custom' | 'grok' | 'cherry'

export interface AIProviderConfig {
  provider: AIProvider
  apiKey: string
  baseUrl?: string
  model: string
  temperature?: number
}

export interface AISettings {
  enabled: boolean
  provider: AIProviderConfig
}

// ============ Outline Types ============

export interface OutlineItem {
  id: string
  level: number
  text: string
  children: OutlineItem[]
}
