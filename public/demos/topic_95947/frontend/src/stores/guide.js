import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const GUIDE_STATE_KEY = 'business_guide_state_v1'
const GUIDE_EVENTS_KEY = 'business_guide_events_v1'
const MAX_EVENTS = 100

function readStorage(key, fallback) {
  if (typeof window === 'undefined' || !window.localStorage) return fallback

  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.warn(`Failed to read ${key} from localStorage:`, error)
    return fallback
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Failed to write ${key} to localStorage:`, error)
  }
}

function createGuideState(status = 'active') {
  const now = new Date().toISOString()
  return {
    status,
    exposed_count: 0,
    skipped_count: 0,
    completed_count: 0,
    review_count: 0,
    created_at: now,
    updated_at: now
  }
}

export const useGuideStore = defineStore('guide', () => {
  const guides = ref(readStorage(GUIDE_STATE_KEY, {}))
  const events = ref(readStorage(GUIDE_EVENTS_KEY, []))

  const guideEvents = computed(() => events.value)

  function persist() {
    writeStorage(GUIDE_STATE_KEY, guides.value)
    writeStorage(GUIDE_EVENTS_KEY, events.value)
  }

  function ensureGuide(guideId) {
    if (!guideId) return null
    if (!guides.value[guideId]) {
      guides.value[guideId] = createGuideState()
      persist()
    }
    return guides.value[guideId]
  }

  function getGuide(guideId) {
    return ensureGuide(guideId) || createGuideState()
  }

  function isGuideVisible(guideId) {
    if (!guideId) return true
    const guide = getGuide(guideId)
    return guide.status === 'active'
  }

  function recordGuideEvent(guideId, eventType, meta = {}) {
    if (!guideId) return

    events.value = [
      ...events.value,
      {
        guide_id: guideId,
        event_type: eventType,
        meta,
        created_at: new Date().toISOString()
      }
    ].slice(-MAX_EVENTS)

    persist()
  }

  function updateGuide(guideId, status, eventType, counterKey, meta = {}) {
    const guide = ensureGuide(guideId)
    if (!guide) return

    guide.status = status
    guide[counterKey] = (guide[counterKey] || 0) + 1
    guide.updated_at = new Date().toISOString()
    recordGuideEvent(guideId, eventType, meta)
  }

  function recordExposure(guideId, meta = {}) {
    const guide = ensureGuide(guideId)
    if (!guide || guide.status !== 'active') return

    guide.exposed_count = (guide.exposed_count || 0) + 1
    guide.updated_at = new Date().toISOString()
    recordGuideEvent(guideId, 'exposure', meta)
  }

  function skipGuide(guideId, meta = {}) {
    updateGuide(guideId, 'skipped', 'skip', 'skipped_count', meta)
  }

  function completeGuide(guideId, meta = {}) {
    updateGuide(guideId, 'completed', 'complete', 'completed_count', meta)
  }

  function reviewGuide(guideId, meta = {}) {
    updateGuide(guideId, 'active', 'review', 'review_count', meta)
  }

  return {
    guides,
    guideEvents,
    getGuide,
    isGuideVisible,
    recordExposure,
    skipGuide,
    completeGuide,
    reviewGuide
  }
})
