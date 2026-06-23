import { Component } from 'react'
import { AlertOctagon, RefreshCw } from 'lucide-react'

/**
 * ErrorBoundary táctico — captura crashes de cualquier descendiente
 * y muestra una pantalla de "sistema offline" en lugar de white-screen.
 *
 * Uso: <ErrorBoundary><App /></ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // Hook futuro para telemetría (Sentry/Supabase logs)
    if (typeof window !== 'undefined' && window.console) {
      // eslint-disable-next-line no-console
      console.error('[NEXUS::ErrorBoundary]', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleHardReload = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const errMsg = this.state.error?.message || 'Error desconocido'
    const stack  = this.state.errorInfo?.componentStack || ''

    return (
      <div className="min-h-screen bg-nexus-bg flex items-center justify-center p-6 relative overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(239,68,68,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(239,68,68,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 w-full max-w-xl hud-card p-8"
          style={{
            borderColor: '#7f1d1d',
            boxShadow: '0 0 40px rgba(239,68,68,0.2)',
          }}>
          <div className="flex items-center gap-3 mb-4">
            <AlertOctagon className="w-8 h-8 text-red-400 animate-blink" />
            <div>
              <h1 className="text-nexus-text font-bold text-xl tracking-widest">SISTEMA INESTABLE</h1>
              <p className="text-nexus-muted text-xs font-mono uppercase tracking-widest">
                Excepción no controlada — sesión preservada
              </p>
            </div>
          </div>

          <div className="bg-nexus-bg/60 border border-red-900/50 rounded-md p-3 mb-4 font-mono text-xs">
            <div className="text-red-300 font-bold mb-1">// ERROR</div>
            <div className="text-nexus-text break-words">{errMsg}</div>
          </div>

          {stack && (
            <details className="mb-4">
              <summary className="text-nexus-muted text-xs font-mono cursor-pointer hover:text-nexus-text">
                Mostrar traza de componentes
              </summary>
              <pre className="mt-2 text-[10px] text-nexus-muted font-mono whitespace-pre-wrap bg-nexus-bg/40 p-2 rounded border border-nexus-border max-h-48 overflow-auto">
                {stack}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={this.handleReset}
              className="flex-1 py-2.5 rounded-md font-mono text-xs uppercase tracking-widest border border-blue-700 text-blue-300 hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reintentar sesión
            </button>
            <button
              onClick={this.handleHardReload}
              className="flex-1 py-2.5 rounded-md font-mono text-xs uppercase tracking-widest text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #b91c1c, #7f1d1d)' }}
            >
              Reinicio completo
            </button>
          </div>

          <p className="text-nexus-muted text-[10px] font-mono text-center mt-4 opacity-60">
            Tus datos locales no se perdieron. El sistema preserva el estado en localStorage.
          </p>
        </div>
      </div>
    )
  }
}
