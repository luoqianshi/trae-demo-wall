import { Component, type ReactNode } from "react";
import { ICONS } from "@/lib/icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a14] px-6 text-center">
          <ICONS.AlertTriangle className="mb-4 h-12 w-12 text-neon-magenta" />
          <h2 className="mb-2 text-xl font-semibold text-white">出错了</h2>
          <p className="mb-6 max-w-md text-sm text-white/50">
            页面渲染遇到了问题，请尝试刷新页面。
          </p>
          <p className="mb-4 max-w-lg rounded-lg bg-white/5 px-4 py-2 text-xs text-white/30 font-mono">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="rounded-lg bg-neon-cyan/10 px-6 py-2.5 text-sm font-medium text-neon-cyan transition hover:bg-neon-cyan/20"
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}