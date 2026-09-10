import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * 兜底错误边界：任一行情 / 表格渲染抛错时，页面不会整片白屏，而是给出可恢复的提示。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[xueqiu-portfolio] 渲染异常:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="text-slate-700">页面渲染出错</div>
        <div className="max-w-md text-xs break-all text-rose-400">{error.message}</div>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-1 rounded-full border border-rose-200 bg-white px-4 py-1.5 text-xs text-rose-600 transition hover:bg-rose-50"
        >
          重试
        </button>
      </div>
    );
  }
}
