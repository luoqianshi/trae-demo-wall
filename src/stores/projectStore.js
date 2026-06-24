import { defineStore } from 'pinia'

export const useProjectStore = defineStore('project', {
  state: () => ({
    indexData: null,
    allProjects: [],
    loadedPages: new Set(),
    pageCache: {},
    currentTag: '全部',
    searchQuery: '',
    sortBy: 'newest',
    filteredProjects: [],
    visibleCount: 12,
    batchSize: 12,
    isLoading: false,
    isAllLoaded: false,
  }),

  getters: {
    tags(state) {
      if (!state.indexData) return []
      return ['全部', ...Object.keys(state.indexData.stats.tagCounts)]
    },
    projectCount(state) {
      return state.filteredProjects.length
    },
    visibleProjects(state) {
      return state.filteredProjects.slice(0, state.visibleCount)
    },
  },

  actions: {
    async loadIndex() {
      if (this.indexData) return
      try {
        const resp = await fetch('./data/index.json')
        const data = await resp.json()
        this.indexData = data
        this.allProjects = data.projects
        this.filter()
      } catch (e) {
        console.error('Failed to load index:', e)
      }
    },

    async loadPage(pageNum) {
      if (this.loadedPages.has(pageNum)) return
      try {
        const resp = await fetch(`./data/pages/page-${pageNum}.json`)
        const data = await resp.json()
        this.loadedPages.add(pageNum)
        this.pageCache[pageNum] = data.projects
      } catch (e) {
        console.error(`Failed to load page ${pageNum}:`, e)
      }
    },

    async loadMore() {
      if (this.isLoading || this.isAllLoaded) return
      this.isLoading = true

      const neededCount = this.visibleCount + this.batchSize
      const neededPage = Math.ceil(neededCount / 20)

      for (let i = 1; i <= neededPage; i++) {
        if (!this.loadedPages.has(i)) {
          await this.loadPage(i)
        }
      }

      this.visibleCount = neededCount

      if (this.visibleCount >= this.filteredProjects.length) {
        this.visibleCount = this.filteredProjects.length
        this.isAllLoaded = true
      }

      this.isLoading = false
    },

    async getProjectDetail(id) {
      for (const pageNum of this.loadedPages) {
        const projects = this.pageCache[pageNum]
        if (projects) {
          const found = projects.find(p => p.id === id)
          if (found) return found
        }
      }
      const idx = this.allProjects.findIndex(p => p.id === id)
      if (idx === -1) return null
      const pageNum = Math.floor(idx / 20) + 1
      await this.loadPage(pageNum)
      const projects = this.pageCache[pageNum]
      return projects ? projects.find(p => p.id === id) : null
    },

    setTag(tag) {
      this.currentTag = tag
      this.resetVisible()
      this.filter()
    },

    setSearch(query) {
      this.searchQuery = query.toLowerCase().trim()
      this.resetVisible()
      this.filter()
    },

    setSort(sort) {
      this.sortBy = sort
      this.resetVisible()
      this.filter()
    },

    filter() {
      let projects = [...this.allProjects]

      if (this.currentTag !== '全部') {
        projects = projects.filter(p => p.tags.includes(this.currentTag))
      }

      if (this.searchQuery) {
        projects = projects.filter(p =>
          p.title.toLowerCase().includes(this.searchQuery) ||
          p.author.toLowerCase().includes(this.searchQuery)
        )
      }

      switch (this.sortBy) {
        case 'views':
          projects.sort((a, b) => b.views - a.views)
          break
        case 'likes':
          projects.sort((a, b) => b.likes - a.likes)
          break
        case 'newest':
        default:
          projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }

      this.filteredProjects = projects
    },

    resetVisible() {
      this.visibleCount = this.batchSize
      this.isAllLoaded = false
    },
  },
})
