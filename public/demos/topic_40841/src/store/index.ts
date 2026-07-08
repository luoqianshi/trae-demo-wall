import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Activity, UserUpload, RiskLog, SurplusItem, Qualification, ActivityType, QualificationType } from '@/types'
import {
  geoActivities,
  certActivities,
  contestActivities,
  userUploads as initialUploads,
  riskLogs as initialRiskLogs,
  surplusItems as initialSurplusItems,
  qualifications as initialQualifications,
} from '@/mock/data'

interface StoreState {
  activities: Activity[]
  uploads: UserUpload[]
  riskLogs: RiskLog[]
  surplusItems: SurplusItem[]
  qualifications: Qualification[]
  favoriteIds: string[]

  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void

  submitUpload: (data: { title: string; type: ActivityType; description: string; submitter: string }) => void
  approveUpload: (id: string) => void
  rejectUpload: (id: string) => void

  addQualification: (data: { applicantName: string; type: QualificationType; description: string }) => void

  deleteActivity: (id: string) => void
  toggleActivityStatus: (id: string) => void

  resetDemoData: () => void
}

const initialActivities = [...geoActivities, ...certActivities, ...contestActivities]

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      activities: initialActivities,
      uploads: initialUploads,
      riskLogs: initialRiskLogs,
      surplusItems: initialSurplusItems,
      qualifications: initialQualifications,
      favoriteIds: [],

      isFavorite: (id) => get().favoriteIds.includes(id),
      toggleFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(id)
            ? state.favoriteIds.filter(f => f !== id)
            : [...state.favoriteIds, id],
        })),

      submitUpload: (data) => {
        const newUpload: UserUpload = {
          id: `u${Date.now()}`,
          title: data.title,
          type: data.type,
          description: data.description,
          submitter: data.submitter || '匿名用户',
          status: 'pending',
          aiReviewResult: {
            riskLevel: 'low',
            keywords: ['用户上传', '待审核'],
            suggestion: 'AI 初审：未检测到明显风险关键词，建议人工核实后通过。',
            suggestedScore: 75,
          },
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          source: '用户上传',
        }
        set((state) => ({ uploads: [newUpload, ...state.uploads] }))
      },

      approveUpload: (id) => {
        const upload = get().uploads.find(u => u.id === id)
        if (!upload) return
        const newActivity: Activity = {
          id: `ua${Date.now()}`,
          title: upload.title,
          type: upload.type,
          category: '用户上传',
          city: '北京市',
          address: '待补充',
          distance: 0,
          organizer: upload.submitter,
          time: new Date().toLocaleDateString('zh-CN'),
          fee: '免费',
          trustScore: upload.aiReviewResult?.suggestedScore || 75,
          trustLevel: 'verified',
          trustReasons: ['用户上传已审核通过', 'AI 初审未检测到风险', '人工核实通过'],
          officialUrl: '',
          antiFraudTips: ['如发现信息不实请举报'],
          source: 'user',
          status: 'published',
          description: upload.description,
        }
        set((state) => ({
          uploads: state.uploads.map(u => u.id === id ? { ...u, status: 'approved' as const } : u),
          activities: [newActivity, ...state.activities],
        }))
      },

      rejectUpload: (id) =>
        set((state) => ({
          uploads: state.uploads.map(u => u.id === id ? { ...u, status: 'rejected' as const } : u),
        })),

      addQualification: (data) => {
        const newQual: Qualification = {
          id: `q${Date.now()}`,
          applicantName: data.applicantName,
          type: data.type,
          description: data.description,
          status: 'pending_review',
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          verifiedDocs: [],
        }
        set((state) => ({ qualifications: [newQual, ...state.qualifications] }))
      },

      deleteActivity: (id) =>
        set((state) => ({ activities: state.activities.filter(a => a.id !== id) })),

      toggleActivityStatus: (id) =>
        set((state) => ({
          activities: state.activities.map(a =>
            a.id === id
              ? { ...a, status: a.status === 'published' ? 'rejected' as const : 'published' as const }
              : a
          ),
        })),

      resetDemoData: () =>
        set({
          activities: initialActivities,
          uploads: initialUploads,
          riskLogs: initialRiskLogs,
          surplusItems: initialSurplusItems,
          qualifications: initialQualifications,
          favoriteIds: [],
        }),
    }),
    {
      name: 'active-detective-demo',
      version: 2,
      merge: (persisted, current) => {
        const saved = persisted as Partial<StoreState> | undefined
        if (!saved?.activities) return current as StoreState
        const mockById = new Map(initialActivities.map(a => [a.id, a]))
        const activities = saved.activities.map(a => {
          const mock = mockById.get(a.id)
          if (!mock) return a
          return {
            ...mock,
            ...a,
            coverImage: a.coverImage || mock.coverImage,
            coverVideo: a.coverVideo || mock.coverVideo,
          }
        })
        return { ...(current as StoreState), ...saved, activities }
      },
    }
  )
)

export const STORAGE_KEY = 'active-detective-demo'

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      void useStore.persist.rehydrate()
    }
  })
}
