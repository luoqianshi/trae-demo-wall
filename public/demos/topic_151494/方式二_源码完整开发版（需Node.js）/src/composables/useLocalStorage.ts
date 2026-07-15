import { ref, watch, type Ref, type WatchSource } from 'vue'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const read = (): T => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return defaultValue
      return JSON.parse(raw) as T
    } catch {
      return defaultValue
    }
  }

  const state: Ref<T> = ref(read()) as Ref<T>

  const write = (value: T) => {
    ;(state as Ref<any>).value = value
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn('LocalStorage write failed:', e)
    }
  }

  watch(state as WatchSource<T>, (v: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch (e) {
      console.warn('LocalStorage write failed:', e)
    }
  }, { deep: true })

  return { state, write }
}
