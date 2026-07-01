import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] 捕获到错误:', error, errorInfo)
    // 这里可以上报到监控平台
    this.reportError(error, errorInfo)
  }

  private reportError(error: Error, errorInfo: React.ErrorInfo) {
    // 本地记录错误日志
    const errorLog = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    // 存入localStorage用于调试
    const logs = JSON.parse(localStorage.getItem('hengzhou-error-logs') || '[]')
    logs.push(errorLog)
    localStorage.setItem('hengzhou-error-logs', JSON.stringify(logs.slice(-20)))

    // 控制台输出
    console.error('[ErrorReport]', errorLog)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zen-rose/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-zen-rose" />
          </div>
          <h3 className="text-lg font-medium text-ink-primary mb-2">出错了</h3>
          <p className="text-sm text-ink-tertiary mb-6 max-w-sm">
            衡舟遇到了一点小问题。刷新页面通常能解决。
          </p>
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zen-terracotta text-white text-sm font-medium hover:bg-zen-terracotta/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新页面
          </button>
          {this.state.error && (
            <details className="mt-6 text-left">
              <summary className="text-xs text-ink-muted cursor-pointer">错误详情</summary>
              <pre className="mt-2 p-3 rounded-lg bg-canvas text-xs text-ink-tertiary overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
