import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class LazyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isChunkError =
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Loading chunk') ||
        this.state.error?.message?.includes('Failed to fetch');

      return (
        <div className="flex items-center justify-center h-full w-full p-8">
          <div className="text-center max-w-md space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              {isChunkError ? 'Page failed to load' : 'Something went wrong'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isChunkError
                ? 'A required module could not be loaded. This usually happens after an update.'
                : this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Retry
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyErrorBoundary;
