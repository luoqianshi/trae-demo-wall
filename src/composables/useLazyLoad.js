import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useProjectStore } from '@/stores/projectStore'

export function useLazyLoad() {
  const store = useProjectStore()
  const sentinelRef = ref(null)
  let observer = null

  const setupObserver = () => {
    if (observer) observer.disconnect()

    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !store.isAllLoaded && !store.isLoading) {
          store.loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    if (sentinelRef.value) {
      observer.observe(sentinelRef.value)
    }
  }

  onMounted(() => {
    setupObserver()
  })

  onUnmounted(() => {
    if (observer) observer.disconnect()
  })

  watch(() => store.filteredProjects.length, () => {
    if (sentinelRef.value) {
      setupObserver()
    }
  })

  return {
    sentinelRef,
    isLoading: () => store.isLoading,
    isAllLoaded: () => store.isAllLoaded,
  }
}
