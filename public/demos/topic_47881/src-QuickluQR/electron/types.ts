/**
 * HistoryItem 类型定义 - 与 src/hooks/useHistory.ts 保持完全一致
 * 注意:修改此类型时需同步更新 src/hooks/useHistory.ts
 */
export interface HistoryItem {
  id: string
  content: string
  ecLevel: 'L' | 'M' | 'Q' | 'H'
  whiteBg: boolean
  createdAt: number
}

/**
 * HistoryAddItem - 创建历史记录时的输入类型(不含 id 和 createdAt)
 */
export type HistoryAddItem = Omit<HistoryItem, 'id' | 'createdAt'>
