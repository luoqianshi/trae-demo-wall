import { nextTick } from 'vue'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useGuideStore } from '@/stores/guide'

let currentDriver = null
const pointerSnapshot = new Map()

function resolveAvailableSteps(steps) {
  return steps.filter((step) => {
    if (!step.element) return true
    return Boolean(document.querySelector(step.element))
  })
}

function snapshotPointerEvents() {
  pointerSnapshot.clear()
  document.querySelectorAll('.app-layout, .sidebar, .main-content, .page-header, .content-wrapper, .ai-floating-button')
    .forEach((element) => {
      pointerSnapshot.set(element, element.style.pointerEvents || '')
    })
}

function restorePageInteraction() {
  document.documentElement.classList.remove('driver-active', 'driver-active-element-parent', 'driver-active-element-parent-no-scroll')
  document.body.classList.remove('driver-active', 'driver-active-element-parent', 'driver-active-element-parent-no-scroll')
  document.querySelectorAll('.driver-overlay, .driver-popover, .driver-stage, .driver-active-element, .driver-no-interaction, .driver-active-element-parent, .driver-active-element-parent-no-scroll')
    .forEach((element) => {
      element.classList.remove(
        'driver-active-element',
        'driver-no-interaction',
        'driver-active-element-parent',
        'driver-active-element-parent-no-scroll'
      )
      element.removeAttribute('aria-hidden')
      if (element.classList.contains('driver-overlay') || element.classList.contains('driver-popover') || element.classList.contains('driver-stage')) {
        element.remove()
      }
    })

  const selectors = [
    '.app-layout',
    '.sidebar',
    '.main-content',
    '.page-header',
    '.content-wrapper',
    '.ai-floating-button'
  ]

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (pointerSnapshot.has(element)) {
        const original = pointerSnapshot.get(element)
        if (original) element.style.pointerEvents = original
        else element.style.removeProperty('pointer-events')
      } else {
        element.style.removeProperty('pointer-events')
      }
    })
  })
  pointerSnapshot.clear()
}

function cleanupDriver() {
  try {
    currentDriver?.destroy?.()
  } finally {
    currentDriver = null
    restorePageInteraction()
  }
}

export function useSpotlightGuide() {
  const guideStore = useGuideStore()

  async function startGuide({ guideId, steps, force = false, meta = {} }) {
    cleanupDriver()

    if (!guideId || !Array.isArray(steps) || steps.length === 0) return false
    if (!force && !guideStore.isGuideVisible(guideId)) return false

    await nextTick()
    await new Promise(resolve => window.requestAnimationFrame(resolve))

    const availableSteps = resolveAvailableSteps(steps)
    if (!availableSteps.length) return false

    snapshotPointerEvents()

    try {
      currentDriver = driver({
        steps: availableSteps,
        animate: true,
        allowClose: false,
        allowKeyboardControl: true,
        disableActiveInteraction: true,
        overlayColor: '#020617',
        overlayOpacity: 0.72,
        stagePadding: 8,
        stageRadius: 16,
        smoothScroll: true,
        showProgress: true,
        progressText: '{{current}} / {{total}}',
        nextBtnText: '下一步',
        prevBtnText: '上一步',
        doneBtnText: '完成',
        popoverClass: 'business-spotlight-popover',
        onHighlightStarted: (_element, step) => {
          guideStore.recordGuideEvent(guideId, 'step_show', {
            ...meta,
            step: step?.popover?.title || step?.element || 'unknown'
          })
        },
        onDestroyed: () => {
          currentDriver = null
          restorePageInteraction()
          guideStore.completeGuide(guideId, meta)
        }
      })

      currentDriver.drive()
      guideStore.recordExposure(guideId, meta)

      return true
    } catch (error) {
      cleanupDriver()
      throw error
    }
  }

  return {
    startGuide,
    restorePageInteraction,
    cleanupDriver
  }
}
