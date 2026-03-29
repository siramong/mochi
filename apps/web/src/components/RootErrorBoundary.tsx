import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface RootErrorBoundaryProps {
  children: ReactNode
}

interface RootErrorBoundaryState {
  hasError: boolean
}

export class RootErrorBoundary extends Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  public state: RootErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(): RootErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error de runtime en la app web:', error, errorInfo)
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-50 via-white to-white px-6 py-10">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-sm backdrop-blur-sm">
            <AlertTriangle className="h-10 w-10 text-rose-500" aria-hidden="true" />
            <h1 className="text-2xl font-semibold text-gray-800">Algo salió mal</h1>
            <p className="text-sm text-gray-600">
              Ocurrió un error inesperado al cargar el dashboard. Recarga la
              página para intentarlo de nuevo.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
