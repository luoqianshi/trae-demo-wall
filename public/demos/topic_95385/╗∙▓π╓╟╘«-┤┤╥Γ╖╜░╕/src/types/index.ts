export interface User {
  _openid: string
  nickname: string
  avatar: string
  role: 'community' | 'village' | 'volunteer' | 'admin'
  createTime: string
}

export interface Policy {
  id: string
  title: string
  category: string
  content: string
  summary: string
  tags: string[]
  createTime: string
  viewCount: number
}

export interface QARecord {
  id: string
  question: string
  answer: string
  createTime: string
}

export interface Favorite {
  id: string
  policyId: string
  policy: Policy
  createTime: string
}

export interface Category {
  id: string
  name: string
  icon: string
  count: number
}

export interface Feature {
  id: string
  title: string
  description: string
  color: string
  icon: string
}

export interface Scenario {
  id: string
  title: string
  description: string
  detail: string
  color: string
  icon: string
}

export interface Stat {
  id: string
  value: number
  label: string
  description: string
  icon: string
  color: string
}