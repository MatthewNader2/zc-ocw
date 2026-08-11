import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.props.compact) {
        return (
          <div className="p-6 rounded-2xl bg-red-50/50 border border-red-200/60 text-center my-4">
            <h3 className="font-display font-semibold text-red-900 text-sm mb-1">
              {this.props.title || "Unable to display this section"}
            </h3>
            <p className="text-xs text-red-700/80 mb-3">
              An unexpected error occurred.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-red-700 border border-red-200 shadow-sm hover:bg-red-50"
            >
              Try Again
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center bg-ocean-950 text-white p-6 rounded-2xl">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4 font-display">
              {this.props.title || "Something went wrong"}
            </h1>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              An error occurred while loading this section. Please try again or return home.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-outline-dark text-xs"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="btn-primary text-xs"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
