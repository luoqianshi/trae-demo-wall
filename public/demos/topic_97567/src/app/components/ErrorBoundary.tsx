import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorKey: number;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState((prev) => ({ hasError: false, error: null, errorKey: prev.errorKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-lg border border-white/80 p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-6">🔧</div>
            <h1 className="text-2xl font-bold text-[#FFB6C1] mb-4">出了点小问题</h1>
            <p className="text-gray-500 mb-2">别担心，这只是一个临时的小故障</p>
            {this.state.error && (
              <p className="text-gray-400 text-xs mb-6 bg-gray-50 rounded-xl p-3 break-all">
                {this.state.error.message}
              </p>
            )}
            {!this.state.error && <div className="mb-6" />}
            <div className="flex flex-col gap-4">
              <button
                onClick={this.handleRetry}
                className="bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
              >
                重试
              </button>
              <a
                href="/"
                className="text-[#87CEEB] hover:text-[#6BB6E8] font-semibold transition-colors"
              >
                返回首页
              </a>
            </div>
          </div>
        </div>
      );
    }

    return <React.Fragment key={this.state.errorKey}>{this.props.children}</React.Fragment>;
  }
}

export default ErrorBoundary;
