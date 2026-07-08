export type ActivityType = 'geo' | 'cert' | 'contest'
export type TrustLevel = 'verified' | 'pending' | 'risk'
export type ActivityStatus = 'published' | 'pending' | 'rejected'
export type ActivitySource = 'crawler' | 'user' | 'official'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface Activity {
  id: string
  title: string
  type: ActivityType
  category: string
  city: string
  address: string
  distance: number
  organizer: string
  time: string
  fee: string
  trustScore: number
  trustLevel: TrustLevel
  trustReasons: string[]
  officialUrl: string
  antiFraudTips: string[]
  source: ActivitySource
  status: ActivityStatus
  coverImage?: string
  /** 封面视频（如 TRAE 官方宣传），优先于 coverImage 展示 */
  coverVideo?: string
  icon?: string
  description?: string
  difficulty?: string
  valueScore?: string
  intermediaryRisk?: string
  riskKeywords?: string[]
  enrollSteps?: string[]
}

export type UploadStatus = 'pending' | 'approved' | 'rejected'

export interface AIReviewResult {
  riskLevel: 'low' | 'medium' | 'high'
  keywords: string[]
  suggestion: string
  suggestedScore: number
}

export interface UserUpload {
  id: string
  title: string
  type: ActivityType
  description: string
  submitter: string
  status: UploadStatus
  aiReviewResult?: AIReviewResult
  createdAt: string
  source: string
}

export interface RiskLog {
  id: string
  title: string
  riskType: string
  level: 'low' | 'medium' | 'high'
  detail: string
  time: string
  source: string
  riskScore: number
  keywords: string[]
  status: string
}

export interface SurplusItem {
  id: string
  shopName: string
  itemName: string
  quantity: number
  pickupTime: string
  address: string
  status: 'available' | 'claimed' | 'expired'
  distance: number
  foodType: string
  safetyVerified: boolean
  coverImage?: string
}

export type QualificationType = 'sanitation_worker' | 'disabled' | 'low_income' | 'elderly_alone'
export type QualificationStatus = 'pending_review' | 'pending_match' | 'completed' | 'rejected'

export interface Qualification {
  id: string
  applicantName: string
  type: QualificationType
  description: string
  status: QualificationStatus
  createdAt: string
  verifiedDocs: string[]
}
