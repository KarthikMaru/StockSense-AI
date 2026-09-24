import { Component } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Catches rendering errors anywhere in the component tree below it and
 * shows a friendly fallback instead of an unrecoverable blank screen.
 * Class component because React error boundaries currently require
 * componentDidCatch/getDerivedStateFromError, which hooks can't express.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Unhandled error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center dark:bg-surface-dark">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            An unexpected error occurred. Try reloading the page — if the problem persists, the
            backend API may be unreachable.
          </p>
          <button
            onClick={this.handleReload}
            className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Back to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
