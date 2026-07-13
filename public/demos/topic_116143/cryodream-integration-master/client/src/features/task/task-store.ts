import { create } from 'zustand'
import { taskApi, type Task } from './task-api'

interface TaskState {
  tasks: Task[]
  loading: boolean
  pollTimer: ReturnType<typeof setInterval> | null

  fetchTasks: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  pollTimer: null,

  fetchTasks: async () => {
    try {
      const tasks = await taskApi.recent()
      set({ tasks, loading: false })
    } catch (error) {
      console.error('[taskStore] fetchTasks failed:', error)
      set({ loading: false })
    }
  },

  startPolling: () => {
    const { pollTimer, fetchTasks } = get()
    if (pollTimer) return

    // 立即拉取一次
    fetchTasks()

    // 每 3 秒轮询
    const timer = setInterval(() => {
      fetchTasks()
    }, 3000)

    set({ pollTimer: timer })
  },

  stopPolling: () => {
    const { pollTimer } = get()
    if (pollTimer) {
      clearInterval(pollTimer)
      set({ pollTimer: null })
    }
  },
}))
