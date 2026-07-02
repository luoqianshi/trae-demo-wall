export interface Milestone {
  id: string
  name: string
  deadline: string
  completed: boolean
}

const STORAGE_KEY_PREFIX = 'caijianji_milestones_'

export function getMilestones(planId: string): Milestone[] {
  if (typeof window === 'undefined') return []
  try {
    const key = `${STORAGE_KEY_PREFIX}${planId}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function setMilestones(planId: string, milestones: Milestone[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${planId}`, JSON.stringify(milestones))
  }
}

export function addMilestone(planId: string, milestone: Omit<Milestone, 'id'>): Milestone {
  const newMilestone: Milestone = {
    ...milestone,
    id: `ms_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  }
  const milestones = getMilestones(planId)
  milestones.push(newMilestone)
  setMilestones(planId, milestones)
  return newMilestone
}

export function removeMilestone(planId: string, milestoneId: string): void {
  const milestones = getMilestones(planId).filter(m => m.id !== milestoneId)
  setMilestones(planId, milestones)
}

export function updateMilestone(
  planId: string,
  milestoneId: string,
  updates: Partial<Milestone>
): void {
  const milestones = getMilestones(planId).map(m =>
    m.id === milestoneId ? { ...m, ...updates } : m
  )
  setMilestones(planId, milestones)
}
