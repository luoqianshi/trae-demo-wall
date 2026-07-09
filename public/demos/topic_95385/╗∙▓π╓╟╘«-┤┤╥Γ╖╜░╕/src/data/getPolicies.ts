import { policies, categories } from './policies'

export default function getPolicies(params?: { category?: string; keyword?: string; page?: number; pageSize?: number }) {
  let filtered = [...policies]
  
  if (params?.category) {
    filtered = filtered.filter(p => p.category === params.category)
  }
  
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase()
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(kw) ||
      p.summary.toLowerCase().includes(kw) ||
      p.tags.some(tag => tag.toLowerCase().includes(kw))
    )
  }
  
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return {
    policies: filtered.slice(start, end),
    total: filtered.length,
    categories
  }
}