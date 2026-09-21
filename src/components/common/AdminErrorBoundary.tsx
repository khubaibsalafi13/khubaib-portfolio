import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  pageTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl bg-[#06140d] border border-[#3b1818] p-8 max-w-2xl my-6">
          <div className="flex items-center gap-3 text-[#f87171] mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#2a0e0e] border border-[#5c1c1c] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#fef2f2]">
                Failed to load {this.props.pageTitle || 'Admin Component'}
              </h2>
              <p className="text-xs font-mono text-[#fca5a5]">
                A configuration error or unexpected data format occurred.
              </p>
            </div>
          </div>

          <div className="my-4 p-3.5 rounded-xl bg-[#030905] border border-[#261212] font-mono text-xs text-[#fca5a5] overflow-x-auto">
            {this.state.error?.message || 'Unknown render error'}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10b981] hover:bg-[#05df72] text-[#022013] text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry / Recover Component</span>
            </button>

            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#092215] border border-[#143d26] text-[#8ba395] hover:text-white text-xs font-mono transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
