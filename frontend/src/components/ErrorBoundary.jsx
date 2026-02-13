import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    // Keep console output for debugging.
    // eslint-disable-next-line no-console
    console.error("UI crashed:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message ?? String(this.state.error ?? "Unknown error");

    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-gray-200 p-5">
          <div className="text-lg font-semibold text-gray-900">Something went wrong</div>
          <div className="mt-2 text-sm text-gray-600">{message}</div>
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
