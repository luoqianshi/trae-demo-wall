import { defineStore } from 'pinia'
import {
  mockArchive,
  mockMembers,
  mockPhotos,
  mockOralHistories,
  mockDocuments,
  mockExploreArchives
} from '@/mock/data'
import { mockRequest } from '@/api'

// 档案状态：当前档案、家族成员、照片、口述、文档、探索档案
// 统一封装 Mock 数据加载，方便后续替换为真实接口
export const useArchiveStore = defineStore('archive', {
  state: () => ({
    archive: null,
    members: [],
    photos: [],
    oralHistories: [],
    documents: [],
    exploreArchives: [],
    loading: false
  }),

  getters: {
    // 家族成员按代分组：第一代 parentId 为 null，第二代 parentId 指向第一代，以此类推
    generations: (state) => {
      const byParent = new Map()
      state.members.forEach((m) => {
        const key = m.parentId ?? 0
        if (!byParent.has(key)) byParent.set(key, [])
        byParent.get(key).push(m)
      })
      // 递归构建代际
      const roots = state.members.filter((m) => m.parentId === null)
      const result = []
      let current = roots
      while (current.length) {
        result.push(current)
        const next = []
        current.forEach((p) => {
          const children = state.members.filter((c) => c.parentId === p.id)
          next.push(...children)
        })
        current = next
      }
      return result
    }
  },

  actions: {
    // 拉取当前家庭档案
    async fetchArchive() {
      this.loading = true
      try {
        // 真实接口：await api.get('/archive')
        this.archive = await mockRequest(mockArchive, 200)
      } finally {
        this.loading = false
      }
    },

    // 拉取家族成员
    async fetchMembers() {
      this.members = await mockRequest(mockMembers, 250)
    },

    // 添加家族成员
    async addMember(payload) {
      const nextId = Math.max(0, ...this.members.map((m) => m.id)) + 1
      const newMember = { id: nextId, ...payload }
      // 真实接口：await api.post('/members', payload)
      await mockRequest(null, 300)
      this.members.push(newMember)
      if (this.archive) this.archive.memberCount = this.members.length
      return newMember
    },

    // 拉取照片
    async fetchPhotos() {
      this.photos = await mockRequest(mockPhotos, 250)
    },

    // 上传照片
    async uploadPhoto(payload) {
      const nextId = Math.max(0, ...this.photos.map((p) => p.id)) + 1
      const newPhoto = {
        id: nextId,
        isRestored: false,
        isColored: false,
        ...payload
      }
      await mockRequest(null, 400)
      this.photos.unshift(newPhoto)
      if (this.archive) this.archive.photoCount = this.photos.length
      return newPhoto
    },

    // 更新照片状态（修复/上色完成）
    updatePhoto(id, patch) {
      const idx = this.photos.findIndex((p) => p.id === id)
      if (idx >= 0) {
        this.photos[idx] = { ...this.photos[idx], ...patch }
      }
    },

    // 拉取口述历史
    async fetchOralHistories() {
      this.oralHistories = await mockRequest(mockOralHistories, 250)
    },

    // 新增口述录音
    async addOralHistory(payload) {
      const nextId = Math.max(0, ...this.oralHistories.map((o) => o.id)) + 1
      const newOral = { id: nextId, ...payload }
      await mockRequest(null, 200)
      this.oralHistories.unshift(newOral)
      if (this.archive) this.archive.oralCount = this.oralHistories.length
      return newOral
    },

    // 拉取文档
    async fetchDocuments() {
      this.documents = await mockRequest(mockDocuments, 250)
    },

    // 更新文档 OCR 结果
    updateDocument(id, patch) {
      const idx = this.documents.findIndex((d) => d.id === id)
      if (idx >= 0) {
        this.documents[idx] = { ...this.documents[idx], ...patch }
      }
    },

    // 拉取探索档案
    async fetchExploreArchives() {
      this.exploreArchives = await mockRequest(mockExploreArchives, 250)
    }
  }
})
