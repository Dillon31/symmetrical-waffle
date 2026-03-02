import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, ship this to an error tracker (Sentry, etc.)
    console.error('[LexOps ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8 text-center">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 shadow-sm">
          <div className="mb-4 text-5xl">⚠️</div>
          <h1 className="mb-2 text-lg font-bold text-gray-900">Something went wrong</h1>
          <p className="mb-6 text-sm text-gray-500">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Reload page
          </button>
        </div>
      </div>
    )
  }
}
