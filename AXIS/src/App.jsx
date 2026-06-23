import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import { Shield, LayoutGrid, FileText, TrendingUp, LogOut, Sun, Moon, WifiOff, Target, Plus, Users, Command, Flame, Settings as SettingsIcon, ClipboardCheck, Sparkles, Focus } from 'lucide-react'
import { NEXUSProvider, useNEXUS } from './context/NEXUSContext'
import LoginScreen from './components/auth/LoginScreen'
import ModalCrisis from './components/protocolo/ModalCrisis'
import FocusMode from './components/activo/FocusMode'
import NotificationCenter from './components/ui/NotificationCenter'
import ErrorBoundary from './components/ui/ErrorBoundary'
import SprintSelector from './components/ui/SprintSelector'
import MissionComposer from './components/mision/MissionComposer'
import CommandPalette from './components/ui/CommandPalette'
import OnboardingDiagnostic from './components/onboarding/OnboardingDiagnostic'

// Lazy-load views secundarias (reducen bundle inicial)
const StrategyView      = lazy(() => import('./components/strategy/StrategyView'))
const SIRHistorial      = lazy(() => import('./components/sir/SIRHistorial'))
const DashboardMetrics  = lazy(() => import('./components/hud/DashboardMetrics'))
const TeamView          = lazy(() => import('./components/capacity/TeamView'))

// Playbook-adapted HUD views (Ola 3 — vistas adaptadas por dominio)
const StandardHUD       = lazy(() => import('./components/hud/playbook-views/StandardHUD'))
const PipelineHUD       = lazy(() => import('./components/hud/playbook-views/PipelineHUD'))
const StreakHUD         = lazy(() => import('./components/hud/playbook-views/StreakHUD'))
const MultiTrackHUD     = lazy(() => import('./components/hud/playbook-views/MultiTrackHUD'))

// Olas 4 + 7
const WeeklyReviewModal = lazy(() => import('./components/review/WeeklyReviewModal'))
const SettingsView      = lazy(() => import('./components/settings/SettingsView'))
const InsightsPanel     = lazy(() => import('./components/insights/InsightsPanel'))
const NowMode           = lazy(() => import('./components/now/NowMode'))
const MissionCelebration = lazy(() => import('./components/celebration/MissionCelebration'))
const WelcomeBackBanner = lazy(() => import('./components/welcome/WelcomeBackBanner'))
const QuickCapture     = lazy(() => import('./components/quick/QuickCapture'))
const KeyboardShortcuts = lazy(() => import('./components/shortcuts/KeyboardShortcuts'))

// Mapa día (string normalizado) → 0..6 (Domingo..Sábado)
const DOW_MAP = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, 'miércoles': 3,
  jueves: 4, viernes: 5, sabado: 6, 'sábado': 6,
}

// Mapa de vistaHUD del playbook → componente. Default: StandardHUD.
const HUD_BY_VISTA = {
  pipeline: PipelineHUD,
  streak: StreakHUD,
  'multi-track': MultiTrackHUD,
  standard: StandardHUD,
}

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

function Topbar({ onCompose, onPalette, onOpenReview, onOpenNow }) {
  const { currentUser, isDirector, logout, activeView, setActiveView, metricas, darkMode, toggleDarkMode, sirs, axisMode, streakActual } = useNEXUS()
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
  const sirsPendientes = sirs.filter(s => !s.leido).length
  const online = useOnlineStatus()
  const isSolo = axisMode === 'solo'

  const navItems = isDirector ? (
    isSolo
      ? [
          { id: 'hud',      label: 'Mi día',   icon: LayoutGrid },
          { id: 'strategy', label: 'Strategy', icon: Target },
          { id: 'sirs',     label: `Briefs${sirsPendientes > 0 ? ` (${sirsPendientes})` : ''}`, icon: FileText },
          { id: 'metrics',  label: 'Métricas', icon: TrendingUp },
          { id: 'insights', label: 'Insights', icon: Sparkles },
          { id: 'settings', label: 'Ajustes',  icon: SettingsIcon },
        ]
      : [
          { id: 'hud',      label: 'Command',  icon: LayoutGrid },
          { id: 'strategy', label: 'Strategy', icon: Target },
          { id: 'team',     label: 'Team',     icon: Users },
          { id: 'sirs',     label: `Briefs${sirsPendientes > 0 ? ` (${sirsPendientes})` : ''}`, icon: FileText },
          { id: 'metrics',  label: 'Métricas', icon: TrendingUp },
          { id: 'insights', label: 'Insights', icon: Sparkles },
          { id: 'settings', label: 'Ajustes',  icon: SettingsIcon },
        ]
  ) : []

  // Badge de streak — gold accent ≥7 días, oculto si 0
  const streakGold = streakActual >= 7
  const streakStyle = streakGold
    ? { background: 'rgba(255,181,71,0.14)', color: '#FFD27A', border: '1px solid rgba(255,181,71,0.45)' }
    : { background: 'rgba(91,141,239,0.10)', color: '#9CB4F0', border: '1px solid rgba(91,141,239,0.30)' }

  return (
    <header className="h-12 glass-bar flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-400" />
        <span className="font-bold text-nexus-text tracking-widest text-sm">AXIS</span>
        <span className="text-nexus-muted text-xs font-mono hidden md:inline">Execution OS</span>
        <span className="text-nexus-muted text-xs font-mono hidden sm:inline">// {currentUser?.codename || currentUser?.nombre}</span>
        <SprintSelector />
        {streakActual > 0 && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded font-mono inline-flex items-center gap-1.5"
            style={streakStyle}
            title={`Racha actual: ${streakActual} día${streakActual !== 1 ? 's' : ''} consecutivo${streakActual !== 1 ? 's' : ''} con misiones completadas`}
            aria-label={`Racha de ${streakActual} días`}
          >
            <Flame className="w-3 h-3" />
            {streakActual} {streakActual === 1 ? 'día' : 'días'}
          </span>
        )}
        {!online && (
          <span className="bg-yellow-600/30 text-yellow-300 border border-yellow-700 text-xs font-bold px-2 py-0.5 rounded font-mono flex items-center gap-1" title="Sin conexión">
            <WifiOff className="w-3 h-3" />OFFLINE
          </span>
        )}
        {isDirector && metricas.enCrisis > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded font-mono inline-flex items-center gap-1.5"
            style={{ background: 'rgba(255,84,112,0.14)', color: '#FF8AA0', border: '1px solid rgba(255,84,112,0.35)' }}>
            <span className="status-dot bg-axis-flare status-pulse" />
            {metricas.enCrisis} bloqueo{metricas.enCrisis !== 1 ? 's' : ''}
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
        {onPalette && currentUser && (
          <button onClick={onPalette}
            title={`Command palette (${isMac ? '⌘' : 'Ctrl'}+K)`}
            aria-label="Abrir command palette"
            className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-mono text-nexus-muted hover:text-nexus-text hover:bg-nexus-bg/60 transition-all">
            <Command className="w-3.5 h-3.5" />
            <kbd className="text-[9px] bg-nexus-bg/60 border border-nexus-border px-1 rounded">{isMac ? '⌘' : 'Ctrl'}K</kbd>
          </button>
        )}
        {onOpenNow && currentUser && (
          <button onClick={onOpenNow}
            title="Now Mode (foco profundo — F)"
            aria-label="Abrir Now Mode"
            className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-mono text-nexus-muted hover:text-blue-300 hover:bg-nexus-bg/60 transition-all">
            <Focus className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Now</span>
            <kbd className="hidden lg:inline text-[9px] bg-nexus-bg/60 border border-nexus-border px-1 rounded">F</kbd>
          </button>
        )}
        {isDirector && onOpenReview && (
          <button onClick={onOpenReview}
            title="Weekly Review"
            aria-label="Abrir Weekly Review"
            className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-mono text-nexus-muted hover:text-blue-300 hover:bg-nexus-bg/60 transition-all">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Review</span>
          </button>
        )}
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
  const { userPlaybook } = useNEXUS()
  const vista = userPlaybook?.vistaHUD || 'standard'
  const ViewComp = HUD_BY_VISTA[vista] || StandardHUD
  return (
    <ViewSuspense>
      <ViewComp />
    </ViewSuspense>
  )
}

function AppInner() {
  const { currentUser, isDirector, activeView, darkMode, needsOnboarding, applyPlaybook, axisMode, userPlaybook, lastReviewAt } = useNEXUS()
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerMission, setComposerMission] = useState(null)
  const [composerDefaults, setComposerDefaults] = useState({})
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [nowMode, setNowMode] = useState(null)
  const [quickOpen, setQuickOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [onboardingSkipped, setOnboardingSkipped] = useState(false)
  const showOnboarding = needsOnboarding && !onboardingSkipped

  const openComposer = () => { setComposerMission(null); setComposerDefaults({}); setComposerOpen(true) }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    document.body.style.background = darkMode ? '#0a0e27' : '#f0f4ff'
    document.body.style.color      = darkMode ? '#e0e6ff' : '#1e2a5e'
  }, [darkMode])

  // Atajos globales: N (composer), I (quick capture), ? (shortcuts), Cmd/Ctrl+K (palette)
  // Ref pattern: el listener se monta UNA VEZ y consulta refs siempre actuales.
  // Esto evita re-attach del listener en cada cambio de estado de modal
  // (que generaba flicker y leaks acumulados de event listeners).
  const stateRef = useRef({})
  useEffect(() => {
    stateRef.current = {
      isDirector, currentUser,
      composerOpen, paletteOpen, quickOpen, shortcutsOpen, reviewOpen, nowMode,
    }
  })
  useEffect(() => {
    const isTyping = () => ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
    const onKey = (e) => {
      const s = stateRef.current
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
        return
      }
      if (isTyping()) return
      const anyModalOpen = s.composerOpen || s.paletteOpen || s.quickOpen || s.shortcutsOpen || s.reviewOpen || !!s.nowMode
      if (e.key === '?' && !anyModalOpen) {
        e.preventDefault()
        setShortcutsOpen(true)
        return
      }
      if ((e.key === 'i' || e.key === 'I') && !anyModalOpen && s.currentUser) {
        e.preventDefault()
        setQuickOpen(true)
        return
      }
      if (!s.isDirector) return
      if (e.key === 'n' && !anyModalOpen) {
        e.preventDefault()
        openComposer()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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

  // Apertura del weekly review por evento global (CommandPalette, settings, etc.)
  useEffect(() => {
    const onReview = () => setReviewOpen(true)
    window.addEventListener('axis:review:open', onReview)
    return () => window.removeEventListener('axis:review:open', onReview)
  }, [])

  // Apertura de Now Mode (foco profundo) por evento global o tecla F
  useEffect(() => {
    const onNow = (e) => setNowMode({ tareaId: e.detail?.tareaId || null })
    const onKey = (e) => {
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if (e.key === 'f' && !isTyping && !nowMode && !composerOpen && !paletteOpen && !reviewOpen) {
        e.preventDefault()
        setNowMode({ tareaId: null })
      }
    }
    window.addEventListener('axis:now:open', onNow)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('axis:now:open', onNow)
      window.removeEventListener('keydown', onKey)
    }
  }, [nowMode, composerOpen, paletteOpen, reviewOpen])

  // Auto-trigger del Weekly Review (Ola 4)
  useEffect(() => {
    if (!currentUser || !userPlaybook?.ritualSemanal) return
    const check = () => {
      if (reviewOpen) return
      const { dia, hora } = userPlaybook.ritualSemanal
      const targetDow = DOW_MAP[String(dia || '').toLowerCase()]
      if (targetDow === undefined) return
      const now = new Date()
      if (now.getDay() !== targetDow) return
      const [h, m] = String(hora || '09:00').split(':').map(Number)
      if (now.getHours() < (h || 0)) return
      if (now.getHours() === (h || 0) && now.getMinutes() < (m || 0)) return
      if (lastReviewAt) {
        const hoursAgo = (now.getTime() - new Date(lastReviewAt).getTime()) / 3_600_000
        if (hoursAgo < 20) return
      }
      setReviewOpen(true)
    }
    check()
    const id = setInterval(check, 5 * 60_000)
    return () => clearInterval(id)
  }, [currentUser, userPlaybook, lastReviewAt, reviewOpen])

  if (!currentUser) return <LoginScreen />

  if (showOnboarding) {
    return (
      <OnboardingDiagnostic
        onComplete={async (deployment) => { await applyPlaybook(deployment); }}
        onSkip={() => setOnboardingSkipped(true)}
      />
    )
  }

  const isSolo = axisMode === 'solo'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Topbar
        onCompose={isDirector ? openComposer : null}
        onPalette={() => setPaletteOpen(true)}
        onOpenReview={() => setReviewOpen(true)}
        onOpenNow={() => setNowMode({ tareaId: null })}
      />
      <main className="flex-1 overflow-hidden">
        {isDirector ? (
          isSolo ? (
            activeView === 'strategy' ? <div className="h-full overflow-y-auto"><ViewSuspense><StrategyView /></ViewSuspense></div> :
            activeView === 'sirs'     ? <div className="h-full overflow-y-auto"><ViewSuspense><SIRHistorial /></ViewSuspense></div> :
            activeView === 'metrics'  ? <div className="h-full overflow-y-auto"><ViewSuspense><DashboardMetrics /></ViewSuspense></div> :
            activeView === 'insights' ? <div className="h-full overflow-y-auto"><ViewSuspense><InsightsPanel /></ViewSuspense></div> :
            activeView === 'settings' ? <div className="h-full overflow-y-auto"><ViewSuspense><SettingsView /></ViewSuspense></div> :
            <div className="h-full overflow-y-auto"><FocusMode /></div>
          ) : (
            activeView === 'hud'      ? <CoronelHUD /> :
            activeView === 'strategy' ? <div className="h-full overflow-y-auto"><ViewSuspense><StrategyView /></ViewSuspense></div> :
            activeView === 'team'     ? <div className="h-full overflow-y-auto"><ViewSuspense><TeamView /></ViewSuspense></div> :
            activeView === 'sirs'     ? <div className="h-full overflow-y-auto"><ViewSuspense><SIRHistorial /></ViewSuspense></div> :
            activeView === 'metrics'  ? <div className="h-full overflow-y-auto"><ViewSuspense><DashboardMetrics /></ViewSuspense></div> :
            activeView === 'insights' ? <div className="h-full overflow-y-auto"><ViewSuspense><InsightsPanel /></ViewSuspense></div> :
            activeView === 'settings' ? <div className="h-full overflow-y-auto"><ViewSuspense><SettingsView /></ViewSuspense></div> :
            <CoronelHUD />
          )
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
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onCompose={openComposer}
      />
      <Suspense fallback={null}>
        <WeeklyReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} />
      </Suspense>
      {nowMode && (
        <Suspense fallback={null}>
          <NowMode tareaId={nowMode.tareaId} onClose={() => setNowMode(null)} />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <MissionCelebration />
      </Suspense>
      <Suspense fallback={null}>
        <QuickCapture open={quickOpen} onClose={() => setQuickOpen(false)} />
      </Suspense>
      <Suspense fallback={null}>
        <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      </Suspense>
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
