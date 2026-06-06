import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    const props = (this as any).props;
    if (props.onReset) {
      props.onReset();
    }
  };

  public render() {
    const state = (this as any).state;
    const props = (this as any).props;

    if (state.hasError) {
      if (props.fallback) {
        return props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl my-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="font-sans text-[15px] font-medium text-[var(--text-primary)] mb-1">
            Failed to load asset library
          </h3>
          <p className="font-mono text-[11px] text-[var(--text-tertiary)] max-w-md mb-5 leading-relaxed">
            {state.error?.message || 'An unexpected rendering error occurred'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 text-[12px] font-medium text-[var(--accent)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-hover)] px-4 py-1.5 rounded-md transition-colors animate-none"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      );
    }

    return props.children;
  }
}
