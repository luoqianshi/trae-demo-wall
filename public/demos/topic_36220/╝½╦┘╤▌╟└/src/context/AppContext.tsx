import { createContext, useContext, useReducer, ReactNode, useMemo } from 'react'

// ============ 类型定义 ============
export type ConcertTier = 'hot' | 'normal' | 'cold'
export type Page = 'home' | 'analysis' | 'prepare' | 'simulate' | 'result'
export type FinalResult = 'success' | 'fail' | 'pending'

export interface AppState {
  concertName: string
  city: string
  ticketTime: string
  tier: ConcertTier
  hotWeight: number
  prepareScore: number
  successRate: number
  networkLatency: number
  optimizationCount: number
  finalResult: FinalResult
  currentPage: Page
  // 准备项完成状态
  checklist: {
    realName: boolean
    payment: boolean
    audience: boolean
    network: boolean
  }
}

export type Action =
  | { type: 'SET_CONCERT'; payload: { name: string; city: string; ticketTime: string; tier: ConcertTier; hotWeight: number } }
  | { type: 'GO_PAGE'; payload: Page }
  | { type: 'OPTIMIZE'; payload: keyof AppState['checklist'] }
  | { type: 'SET_RESULT'; payload: FinalResult }
  | { type: 'RESET' }

// ============ 初始状态 ============
const initialState: AppState = {
  concertName: '',
  city: '',
  ticketTime: '',
  tier: 'normal',
  hotWeight: 0.5,
  prepareScore: 0,
  successRate: 50,
  networkLatency: 120,
  optimizationCount: 0,
  finalResult: 'pending',
  currentPage: 'home',
  checklist: {
    realName: false,
    payment: false,
    audience: false,
    network: false,
  },
}

// ============ 热度映射 ============
export const TIER_INFO: Record<ConcertTier, { hotWeight: number; label: string; color: string; desc: string }> = {
  hot: { hotWeight: 0.95, label: '超热门', color: '#FF3D5A', desc: '百万人竞争' },
  normal: { hotWeight: 0.5, label: '普通', color: '#FFE600', desc: '中等竞争' },
  cold: { hotWeight: 0.2, label: '冷门', color: '#00FF9D', desc: '竞争较低' },
}

// ============ Reducer ============
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CONCERT': {
      const { name, city, ticketTime, tier, hotWeight } = action.payload
      const initialSuccessRate = Math.round((1 - hotWeight) * 100)
      return {
        ...state,
        concertName: name,
        city,
        ticketTime,
        tier,
        hotWeight,
        successRate: initialSuccessRate,
        // 不同热度初始延迟不同
        networkLatency: tier === 'hot' ? 180 : tier === 'normal' ? 120 : 80,
      }
    }
    case 'GO_PAGE':
      return { ...state, currentPage: action.payload }
    case 'OPTIMIZE': {
      const key = action.payload
      if (state.checklist[key]) return state // 已优化不重复
      const newPrepareScore = Math.min(100, state.prepareScore + 25)
      const newSuccessRate = Math.min(98, state.successRate + 15)
      const newLatency = Math.max(8, state.networkLatency - 28)
      return {
        ...state,
        prepareScore: newPrepareScore,
        successRate: newSuccessRate,
        networkLatency: newLatency,
        optimizationCount: state.optimizationCount + 1,
        checklist: { ...state.checklist, [key]: true },
      }
    }
    case 'SET_RESULT':
      return { ...state, finalResult: action.payload }
    case 'RESET':
      return { ...initialState }
    default:
      return state
  }
}

// ============ Context ============
interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
