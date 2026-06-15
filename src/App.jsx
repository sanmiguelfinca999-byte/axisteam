import { useEffect, useState, lazy, Suspense } from 'react'
import { Shield, LayoutGrid, FileText, TrendingUp, LogOut, Sun, Moon, WifiOff, Target, Plus } from 'lucide-react'
import { NEXUSProvider, useNEXUS } from './context/NEXUSContext'
import LoginScreen from './components/auth/LoginScreen'
import ActivoCard from './components/hud/ActivoCard'
import ActivoDetail from './components/hud/ActivoDetail'
import ModalCrisis from './components/protocolo/ModalCrisis'
import FocusMode from './components/activo/FocusMode'
import NotificationCenter from './components/ui/NotificationCenter'
import ErrorBoundary from './components/ui/ErrorBoundary'
import SprintSelector from './components/ui/SprintSelector'
import MissionComposer from './components/mision/MissionComposer'

// Lazy-load views secundarias (reducen bundle inicial)
const StrategyView      = lazy(() => import('./components/strategy/StrategyView'))
const SIRHistorial      = lazy(() => import('./components/sir/SIRHistorial'))
const DashboardMetrics  = lazy(() => import('./components/hud/DashboardMetrics'))

function ViewSuspense({ children }) {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center text-nexus-muted font-mono text-sm">
        <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mr-2" />
        Cargando vista...
      </div>
    }>
      {children}
    </Suspense>
  )
}

function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  useEffect(() => {
    const onUp = () => setOnline(true)
    const onDown = () => setOnline(false)
    window.addEventListener('online', onUp)
    window.addEventListener('offline', onDown)
    return () => {
      window.removeEventListener('online', onUp)
      window.removeEventListener('offline', onDown)
    }
  }, [])
  return online
}

function Topbar({ onCompose }) {
  const { currentUser, isDirector, logout, activeView, setActiveView, metricas, darkMode, toggleDarkMode, sirs } = useNEXUS()
  const sirsPendientes = sirs.filter(s => !s.leido).length
  const online = useOnlineStatus()

  const navItems = isDirector ? [
    { id: 'hud',      label: 'Command',  icon: LayoutGrid },
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'sirs',     label: `Briefs${sirsPendientes > 0 ? ` (${sirsPendientes})` : ''}`, icon: FileText },
    { id: 'metrics',  label: 'Insights', icon: TrendingUp },
  ] : []

  return (
    <header className="h-12 glass-bar flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-400" />
        <span className="font-bold text-nexus-text tracking-widest text-sm">AXIS</span>
        <span className="text-nexus-muted text-xs font-mono hidden md:inline">Execution OS</span>
        <span className="text-nexus-muted text-xs font-mono hidden sm:inline">// {currentUser?.codename || currentUser?.nombre}</span>
        <SprintSelector />
        {!online && (
          <span className="bg-yellow-600/30 text-yellow-300 border border-yellow-700 text-xs font-bold px-2 py-0.5 rounded font-mono flex items-center gap-1" title="Sin conexión">
            <WifiOff className="w-3 h-3" />OFFLINE
          </span>
        )}
        {isDirector && metricas.enCrisis > 0 && (
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded font-mono animate-blink">
            CRISIS {metricas.enCrisis}
          </span>
        )}
      </div>

      {isDirector && (
        <nav className="flex items-center gap-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveView(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${activeView === id ? 'bg-blue-600/20 text-blue-300 border border-blue-600/40' : 'text-nexus-muted hover:text-nexus-text hover:bg-nexus-bg/60'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-1">
        {isDirector && onCompose && (
          <button onClick={onCompose}
            title="Nueva misión (N)"
            aria-label="Crear nueva misión"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold bg-blue-600/20 border border-blue-600/40 text-blue-300 hover:bg-blue-600/30 transition-all">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Nueva misión</span>
            <kbd className="hidden md:inline text-[9px] bg-blue-900/40 px-1 rounded">N</kbd>
          </button>
        )}
        <NotificationCenter />
        <button onClick={toggleDarkMode} className="p-2 text-nexus-muted hover:text-nexus-text transition-colors" title="Alternar tema" aria-label="Alternar tema">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button onClick={logout} className="flex items-center gap-1.5 px-3 py-1.5 text-nexus-muted hover:text-red-400 transition-colors text-xs font-mono" aria-label="Cerrar sesión">
          <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  )
}

function CoronelHUD() {
  const { activosConSalud, selectedActivoId, setSelectedActivoId, sprintActivo, metricas } = useNEXUS()
  const activos = activosConSalud

  useEffect(() => {
    if (!selectedActivoId) return
    const onKey = (e) => { if (e.key === 'Escape') setSelectedActivoId(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedActivoId, setSelectedActivoId])

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className={`flex-1 overflow-y-auto p-4 transition-all duration-300 ${selectedActivoId ? 'hidden lg:block lg:max-w-[calc(100%-380px)]' : ''}`}>
        {sprintActivo && (
          <div className="surface-elevated p-3 mb-4 border-blue-700/40" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(59,130,246,0))' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-nexus-muted text-xs font-mono uppercase tracking-widest">Sprint Goal</span>
                    <span className="text-blue-300 text-xs font-mono">{sprintActivo.nombre}</span>
                  </div>
                  <p className="text-nexus-text text-sm font-medium truncate">{sprintActivo.goal}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <div className="text-nexus-muted">Sprint progress</div>
                  <div className="text-nexus-text font-bold">{metricas.sprintProgreso}%</div>
                </div>
                <div className="text-right">
                  <div className="text-nexus-muted">Points</div>
                  <div className="text-nexus-text font-bold">{metricas.sprintPointsCompletados}/{metricas.sprintPointsTotal}</div>
                </div>
              </div>
            </div>
            <div className="mt-2 w-full bg-nexus-bg rounded-full h-1">
              <div className="h-1 rounded-full bg-blue-500 transition-all" style={{ width: `${metricas.sprintProgreso}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-nexus-border/50" />
          <span className="text-nexus-muted text-xs font-mono uppercase tracking-widest">Operators {activos.length}</span>
          <div className="h-px flex-1 bg-nexus-border/50" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 stagger-in">
          {activos.map(activo => <ActivoCard key={activo.id} activo={activo} />)}
        </div>
      </div>

      {selectedActivoId && (
        <div className="w-full lg:w-96 border-l border-nexus-border bg-nexus-surface overflow-y-auto flex-shrink-0">
          <ActivoDetail />
        </div>
      )}
    </div>
  )
}

function AppInner() {
  const { currentUser, isDirector, activeView, darkMode } = useNEXUS()
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerMission, setComposerMission] = useState(null)
  const [composerDefaults, setComposerDefaults] = useState({})

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    document.body.style.background = darkMode ? '#0a0e27' : '#f0f4ff'
    document.body.style.color      = darkMode ? '#e0e6ff' : '#1e2a5e'
  }, [darkMode])

  // Atajo "N" para nueva misión (solo Director)
  useEffect(() => {
    if (!isDirector) return
    const onKey = (e) => {
      if (e.key === 'n' && !composerOpen && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        setComposerMission(null)
        setComposerDefaults({})
        setComposerOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDirector, composerOpen])

  // Exponer apertura del composer al árbol (los hijos lo invocan via custom event)
  useEffect(() => {
    const onCompose = (e) => {
      setComposerMission(e.detail?.mission || null)
      setComposerDefaults(e.detail?.defaults || {})
      setComposerOpen(true)
    }
    window.addEventListener('axis:composer:open', onCompose)
    return () => window.removeEventListener('axis:composer:open', onCompose)
  }, [])

  if (!currentUser) return <LoginScreen />

  return (
    <div className="h-screen flex flex-col overflow-hidden scanlines">
      <Topbar onCompose={isDirector ? (() => { setComposerMission(null); setComposerDefaults({}); setComposerOpen(true) }) : null} />
      <main className="flex-1 overflow-hidden">
        {isDirector ? (
          activeView === 'hud'      ? <CoronelHUD /> :
          activeView === 'strategy' ? <div className="h-full overflow-y-auto"><ViewSuspense><StrategyView /></ViewSuspense></div> :
          activeView === 'sirs'     ? <div className="h-full overflow-y-auto"><ViewSuspense><SIRHistorial /></ViewSuspense></div> :
          activeView === 'metrics'  ? <div className="h-full overflow-y-auto"><ViewSuspense><DashboardMetrics /></ViewSuspense></div> :
          <CoronelHUD />
        ) : (
          <div className="h-full overflow-y-auto"><FocusMode /></div>
        )}
      </main>
      <ModalCrisis />
      <MissionComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        mission={composerMission}
        defaults={composerDefaults}
      />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <NEXUSProvider>
        <AppInner />
      </NEXUSProvider>
    </ErrorBoundary>
  )
}
