export interface Shortcut {
  key: string       // 如 'k'
  meta: boolean     // Cmd/Ctrl
  shift?: boolean
  alt?: boolean
  description: string
  action: () => void
}

// 导出所有快捷键定义
export const SHORTCUTS: Shortcut[] = [
  // 初始化时为空，通过 registerShortcut 动态添加
]

const registry: Shortcut[] = []

export function registerShortcut(s: Shortcut) {
  // 移除同 key+meta+shift+alt 的旧注册
  const idx = registry.findIndex(r => r.key === s.key && r.meta === s.meta && r.shift === s.shift && r.alt === s.alt)
  if (idx > -1) registry.splice(idx, 1)
  registry.push(s)
}

export function unregisterShortcut(key: string, meta: boolean, shift?: boolean, alt?: boolean) {
  const idx = registry.findIndex(r => r.key === key && r.meta === meta && r.shift === shift && r.alt === alt)
  if (idx > -1) registry.splice(idx, 1)
}

export function initKeyboardShortcuts() {
  const handler = (e: KeyboardEvent) => {
    // 忽略输入框内的快捷键（除了 Escape）
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      if (e.key === 'Escape') {
        // Escape 总是生效
      } else {
        return
      }
    }

    for (const s of registry) {
      const metaMatch = s.meta ? (e.metaKey || e.ctrlKey) : true
      const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey
      const altMatch = s.alt ? e.altKey : !e.altKey
      if (e.key.toLowerCase() === s.key && metaMatch && shiftMatch && altMatch) {
        e.preventDefault()
        s.action()
        return
      }
    }
  }

  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}

// 格式化快捷键显示
export function formatShortcut(s: Shortcut): string {
  const parts: string[] = []
  if (s.meta) parts.push(isMac() ? '\u2318' : 'Ctrl')
  if (s.shift) parts.push('\u21E7')
  if (s.alt) parts.push('\u2325')
  parts.push(s.key.toUpperCase())
  return parts.join('+')
}

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
}
