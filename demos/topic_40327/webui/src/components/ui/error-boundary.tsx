import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] 页面渲染崩溃:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl text-center max-w-md"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <div className="h-14 w-14 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(var(--destructive) / 0.1)' }}>
              <AlertTriangle className="h-7 w-7" style={{ color: 'hsl(var(--destructive))' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">页面出错了</h2>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>
                {this.state.error?.message || '发生了未知错误'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="btn inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
              }}
            >
              <RefreshCw className="h-4 w-4" />
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}