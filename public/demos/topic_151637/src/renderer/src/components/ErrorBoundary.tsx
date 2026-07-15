import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] 捕获到渲染错误:', error.message)
    console.error('[ErrorBoundary] 组件栈:', info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    // 尝试清除可能损坏的 session 状态
    try {
      localStorage.removeItem('datapilot-sessions')
    } catch {
      // 忽略
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '40px',
          fontFamily: 'Inter, PingFang SC, Microsoft YaHei, sans-serif',
          color: 'var(--color-ink, #1a1a1a)',
          background: 'var(--color-surface, #fafafa)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠</div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            界面渲染出错
          </h2>
          <p style={{
            fontSize: '13px',
            color: 'var(--color-ink-muted, #78716c)',
            marginBottom: '24px',
            textAlign: 'center',
            maxWidth: '400px',
            lineHeight: 1.6,
          }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#fff',
                background: 'var(--color-accent, #c2410c)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              重置并刷新
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--color-ink, #1a1a1a)',
                background: 'var(--color-surface-alt, #f5f5f4)',
                border: '1px solid var(--color-rule, #e5e5e5)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              仅刷新
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}