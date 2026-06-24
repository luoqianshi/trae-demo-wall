// 错误边界组件

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <span className="text-6xl block mb-4">⚠️</span>
            <h2 className="text-xl font-bold text-text-primary mb-2">出了点问题</h2>
            <p className="text-sm text-text-secondary mb-6">
              页面加载出错，请稍后重试
            </p>
            <button onClick={this.handleReset} className="btn btn-primary mx-auto">
              重新加载
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
