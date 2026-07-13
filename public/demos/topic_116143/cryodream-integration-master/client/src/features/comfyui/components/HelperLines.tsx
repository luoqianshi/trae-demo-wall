import { type CSSProperties } from 'react'
import { useStore, type ReactFlowState } from '@xyflow/react'

interface HelperLinesProps {
  horizontal?: number
  vertical?: number
}

const selector = (state: ReactFlowState) => ({
  width: state.width,
  height: state.height,
  transform: state.transform,
})

/**
 * 节点拖拽时的对齐辅助线（红色细线），覆盖在画布上层。
 */
export function HelperLinesRenderer({ horizontal, vertical }: HelperLinesProps) {
  const { width, height, transform } = useStore(selector)
  const [tx, ty, scale] = transform

  if (horizontal === undefined && vertical === undefined) return null

  const lineStyle: CSSProperties = {
    position: 'absolute',
    background: '#f43f5e',
    zIndex: 5,
    pointerEvents: 'none',
  }

  return (
    <>
      {vertical !== undefined && (
        <div
          style={{
            ...lineStyle,
            left: vertical * scale + tx,
            top: 0,
            width: 1,
            height,
          }}
        />
      )}
      {horizontal !== undefined && (
        <div
          style={{
            ...lineStyle,
            top: horizontal * scale + ty,
            left: 0,
            width,
            height: 1,
          }}
        />
      )}
    </>
  )
}
