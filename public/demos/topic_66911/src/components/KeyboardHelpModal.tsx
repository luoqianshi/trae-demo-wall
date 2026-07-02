'use client'

import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { ChineseBorder } from './ui/ChineseBorder'
import { registerShortcut, unregisterShortcut } from '../lib/keyboard-shortcuts'

/* ------------------------------------------------------------------ */
/*  快捷键列表数据                                                      */
/* ------------------------------------------------------------------ */

interface ShortcutItem {
  keys: string[]
  label: string
}

interface ShortcutGroup {
  title: string
  items: ShortcutItem[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: '导航',
    items: [
      { keys: ['\u2318', 'K'], label: '全局搜索' },
      { keys: ['\u2318', 'N'], label: '新建文档' },
    ],
  },
  {
    title: '编辑',
    items: [
      { keys: ['\u2318', 'D'], label: '切换暗色模式' },
    ],
  },
  {
    title: 'AI',
    items: [
      { keys: ['Alt', '\\'], label: 'AI 补全' },
    ],
  },
  {
    title: '其他',
    items: [
      { keys: ['\u2318', '/'], label: '快捷键帮助' },
      { keys: ['Esc'], label: '关闭弹窗' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  KBD 样式组件                                                       */
/* ------------------------------------------------------------------ */

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-[28px] px-2 py-1 bg-paper-dark border border-border rounded-md text-xs font-mono text-ink-secondary shadow-[0_1px_0_rgba(44,36,32,0.08)]">
      {children}
    </kbd>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function KeyboardHelpModal() {
  const [isOpen, setIsOpen] = useState(false)

  // 注册 Cmd+/ 快捷键
  useEffect(() => {
    const shortcut = {
      key: '/',
      meta: true,
      description: '快捷键帮助',
      action: () => setIsOpen(prev => !prev),
    }
    registerShortcut(shortcut)
    return () => unregisterShortcut('/', true)
  }, [])

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="快捷键"
      size="md"
    >
      <ChineseBorder padding="p-0" className="overflow-hidden">
        <div className="divide-y divide-border-light">
          {SHORTCUT_GROUPS.map(group => (
            <div key={group.title} className="px-5 py-4 first:pt-3 last:pb-3">
              {/* 分组标题 */}
              <h4 className="text-xs font-semibold text-ink-muted tracking-wider uppercase mb-3">
                {group.title}
              </h4>

              {/* 快捷键列表 */}
              <ul className="space-y-2.5">
                {group.items.map((item, idx) => (
                  <li
                    key={`${group.title}-${idx}`}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-ink">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <span key={keyIdx} className="flex items-center gap-1">
                          {keyIdx > 0 && (
                            <span className="text-ink-muted text-xs mx-0.5">+</span>
                          )}
                          <Kbd>{key}</Kbd>
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="px-5 py-3 border-t border-border-light text-center">
          <p className="text-xs text-ink-muted">
            按 <Kbd>Esc</Kbd> 关闭此面板
          </p>
        </div>
      </ChineseBorder>
    </Modal>
  )
}
