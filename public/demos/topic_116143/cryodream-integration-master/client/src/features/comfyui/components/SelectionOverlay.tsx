import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReactFlow, useStore, type Node } from '@xyflow/react'

/**
 * 自定义"多选包围框"覆盖层。
 *
 * 关键实现：直接从 DOM 读被选中节点的 getBoundingClientRect() 来算包围框。
 * 用 React Portal 挂到 document.body，避免被 ReactFlow 内部的 transform（viewport 缩放平移）影响。
 * 使用 position: fixed + 屏幕坐标 —— 完全独立于画布坐标系，保证 100% 视觉包住每个节点。
 *
 * requestAnimationFrame 持续跟踪：
 * - 选中状态变化 → 立即重算
 * - 画布 pan/zoom → 下一帧对齐
 * - 节点尺寸变化（例如循环节点展开）→ 下一帧对齐
 */
export function SelectionOverlay() {
  const rf = useReactFlow()
  const nodes = useStore((s) => s.nodes as Node[])
  const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id)
  const selectedKey = selectedIds.join(',')

  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  const [debug, setDebug] = useState<string>('')
  const rafRef = useRef<number | null>(null)

  // 调试开关：默认打开（发布前可以改成读 window flag）
  // 打开后画布左下角会实时显示每个选中节点的 DOM bounding rect（left,top width×height）
  const debugEnabled = true

  useLayoutEffect(() => {
    if (selectedIds.length < 2) {
      setRect(null)
      setDebug('')
      return
    }

    const container = document.querySelector<HTMLElement>('.react-flow')
    if (!container) return

    const compute = () => {
      let minL = Infinity
      let minT = Infinity
      let maxR = -Infinity
      let maxB = -Infinity
      let hit = 0
      const dbg: string[] = [`selected=${selectedIds.length}`]

      /**
       * 计算节点真实视觉 rect —— 不只用外层 .react-flow__node 的 rect（可能因 measured 未同步而偏小），
       * 而是遍历节点所有子孙元素，取它们 bounding rect 的并集，确保 overflow 溢出的内容也被覆盖。
       */
      const measureNodeRect = (root: HTMLElement): { left: number; top: number; right: number; bottom: number } => {
        let l = Infinity
        let t = Infinity
        let r = -Infinity
        let b = -Infinity
        const rootRect = root.getBoundingClientRect()
        if (rootRect.width > 0 && rootRect.height > 0) {
          l = rootRect.left
          t = rootRect.top
          r = rootRect.right
          b = rootRect.bottom
        }
        // 遍历所有子孙节点（不含 Handle、resize control 等 ReactFlow 内部元素）
        const walk = root.querySelectorAll<HTMLElement>('*')
        for (const child of walk) {
          // 跳过被隐藏或明确为 ReactFlow 附加元素的
          if (child.classList.contains('react-flow__handle')) continue
          if (child.classList.contains('react-flow__resize-control')) continue
          const cr = child.getBoundingClientRect()
          if (cr.width <= 0 || cr.height <= 0) continue
          if (cr.left < l) l = cr.left
          if (cr.top < t) t = cr.top
          if (cr.right > r) r = cr.right
          if (cr.bottom > b) b = cr.bottom
        }
        return { left: l, top: t, right: r, bottom: b }
      }

      for (const id of selectedIds) {
        const el = container.querySelector<HTMLElement>(`.react-flow__node[data-id="${CSS.escape(id)}"]`)
        if (!el) {
          dbg.push(`${id}: NOT FOUND`)
          continue
        }
        const box = measureNodeRect(el)
        if (!Number.isFinite(box.left) || box.right <= box.left || box.bottom <= box.top) {
          dbg.push(`${id}: no visible rect`)
          continue
        }
        hit++
        if (box.left < minL) minL = box.left
        if (box.top < minT) minT = box.top
        if (box.right > maxR) maxR = box.right
        if (box.bottom > maxB) maxB = box.bottom
        dbg.push(
          `${id}: ${Math.round(box.left)},${Math.round(box.top)} ${Math.round(box.right - box.left)}×${Math.round(
            box.bottom - box.top
          )}`
        )
      }
      dbg.push(`bounds: ${Math.round(minL)},${Math.round(minT)} → ${Math.round(maxR)},${Math.round(maxB)}`)
      if (debugEnabled) setDebug(dbg.join('\n'))
      if (hit < 1 || !Number.isFinite(minL)) {
        setRect(null)
        return
      }
      setRect({
        left: minL,
        top: minT,
        width: maxR - minL,
        height: maxB - minT,
      })
    }

    compute()
    const loop = () => {
      compute()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [selectedKey, rf, debugEnabled])

  useEffect(() => {
    // 只在 body 存在时渲染 portal
  }, [])

  if (typeof document === 'undefined') return null

  const PAD = 18

  return createPortal(
    <>
      {rect && (
        <div
          className='comfy-selection-overlay pointer-events-none'
          style={{
            position: 'fixed',
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            zIndex: 50,
          }}
        >
          <div className='comfy-selection-overlay-border absolute inset-0 rounded-[18px]' />
          <div className='comfy-selection-overlay-glow absolute inset-0 rounded-[18px]' />
        </div>
      )}
      {debugEnabled && debug && (
        <pre
          className='pointer-events-none text-white'
          style={{
            position: 'fixed',
            left: 8,
            bottom: 8,
            padding: '6px 10px',
            background: 'rgba(0,0,0,0.85)',
            color: '#4ade80',
            fontSize: 11,
            lineHeight: 1.4,
            borderRadius: 6,
            zIndex: 50,
            fontFamily: 'monospace',
            whiteSpace: 'pre',
            maxWidth: '60vw',
            overflow: 'auto',
          }}
        >
          {debug}
        </pre>
      )}
    </>,
    document.body
  )
}
