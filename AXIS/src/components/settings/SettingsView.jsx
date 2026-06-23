import { useRef, useState } from 'react'
import {
  Settings as SettingsIcon,
  RotateCcw,
  Download,
  Upload,
  Sun,
  Moon,
  User,
  Users,
  Trash2,
  ClipboardCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'

/**
 * SettingsView — Ola 7
 *
 * Vista de ajustes del Execution OS:
 *  - Tu Playbook: nombre + fecha + botón "Rehacer diagnóstico"
 *  - Modo: Solo / Squad toggle
 *  - Tema: dark / light toggle
 *  - Datos: Export JSON · Import JSON · Reset total (2-step confirm)
 *  - Sobre: versión + créditos
 */

const APP_VERSION = '4.1.0-foundation'

export default function SettingsView() {
  const {
    userPlaybook,
    axisMode,
    setAxisMode,
    resetPlaybook,
    darkMode,
    toggleDarkMode,
    exportSnapshot,
    importSnapshot,
    resetAll,
    reviewLog,
    lastReviewAt,
  } = useNEXUS()

  const [confirmReset, setConfirmReset] = useState(0)         // 0 = idle, 1 = first click, 2 = second click
  const [importError, setImportError] = useState('')
  const [importOk, setImportOk] = useState('')
  const fileRef = useRef(null)

  const handleExport = () => {
    const snap = exportSnapshot()
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `axis-snapshot-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportFile = async (e) => {
    setImportError('')
    setImportOk('')
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const snap = JSON.parse(text)
      importSnapshot(snap)
      setImportOk(`Importado: ${file.name}`)
    } catch (err) {
      setImportError(err?.message || 'No se pudo leer el snapshot.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleReset = () => {
    if (confirmReset === 0) {
      setConfirmReset(1)
      // Auto-reset del estado de confirmación a los 5s
      setTimeout(() => setConfirmReset(c => (c === 1 ? 0 : c)), 5000)
    } else if (confirmReset === 1) {
      setConfirmReset(2)
      resetAll()
      // Recarga la app para evitar estado inconsistente
      setTimeout(() => window.location.reload(), 400)
    }
  }

  const handleRehacerDiagnostico = () => {
    if (window.confirm('Rehacer el diagnóstico borrará tu playbook actual y volverá al wizard de onboarding. ¿Continuar?')) {
      resetPlaybook()
      // El context detecta `needsOnboarding` y reabre el wizard automáticamente.
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 max-w-3xl mx-auto">
      <header className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,141,239,0.14)', border: '1px solid rgba(91,141,239,0.35)' }}>
          <SettingsIcon className="w-5 h-5 text-blue-300" />
        </div>
        <div>
          <h1 className="text-nexus-text text-xl font-bold tracking-tight">Ajustes</h1>
          <p className="text-nexus-muted text-xs font-mono">Configura tu Execution OS</p>
        </div>
      </header>

      {/* ============ TU PLAYBOOK ============ */}
      <Section
        icon={Sparkles}
        title="Tu Playbook"
        subtitle="Metodología activa del Execution OS"
      >
        {userPlaybook ? (
          <div className="space-y-3">
            <Row label="Nombre">
              <span className="text-nexus-text font-semibold">{userPlaybook.nombre}</span>
            </Row>
            <Row label="Vista HUD">
              <code className="text-blue-300 text-xs font-mono">{userPlaybook.vistaHUD}</code>
            </Row>
            <Row label="Ciclo">
              <span className="text-nexus-text text-sm">{userPlaybook.ciclo}</span>
            </Row>
            {userPlaybook.ritualSemanal && (
              <Row label="Ritual semanal">
                <span className="text-nexus-text text-sm">
                  {userPlaybook.ritualSemanal.dia} · {userPlaybook.ritualSemanal.hora} · {userPlaybook.ritualSemanal.duracionMin} min
                </span>
              </Row>
            )}
            {userPlaybook.deployedAt && (
              <Row label="Desplegado">
                <span className="text-nexus-muted text-xs font-mono">
                  {new Date(userPlaybook.deployedAt).toLocaleString('es-MX')}
                </span>
              </Row>
            )}
            <div className="pt-2">
              <ActionButton onClick={handleRehacerDiagnostico} icon={RotateCcw}>
                Rehacer diagnóstico
              </ActionButton>
              <p className="text-nexus-muted text-[10px] mt-2">
                Volverás al wizard. Conserva tu progreso actual hasta que confirmes el nuevo despliegue.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-nexus-muted text-sm">No hay playbook activo. Completa el diagnóstico para desplegar tu Execution OS.</p>
        )}
      </Section>

      {/* ============ MODO ============ */}
      <Section
        icon={axisMode === 'solo' ? User : Users}
        title="Modo de operación"
        subtitle={axisMode === 'solo' ? 'Solo Mode — autogestión personal' : 'Squad Mode — orquestación de equipo'}
      >
        <div className="flex gap-2">
          <ModeChip
            active={axisMode === 'solo'}
            onClick={() => setAxisMode('solo')}
            icon={User}
            label="Solo"
            hint="Autogestión personal"
          />
          <ModeChip
            active={axisMode === 'squad'}
            onClick={() => setAxisMode('squad')}
            icon={Users}
            label="Squad"
            hint="Lead + Members"
          />
        </div>
        <p className="text-yellow-400/80 text-[11px] mt-3 flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          Cambiar de modo NO migra tus datos. Las misiones existentes siguen asignadas a sus owners. El cambio afecta la vista y la navegación.
        </p>
      </Section>

      {/* ============ TEMA ============ */}
      <Section
        icon={darkMode ? Moon : Sun}
        title="Tema"
        subtitle={darkMode ? 'Dark Mode — modo táctico nocturno' : 'Light Mode — alta luminosidad'}
      >
        <ActionButton onClick={toggleDarkMode} icon={darkMode ? Sun : Moon}>
          Cambiar a {darkMode ? 'Light Mode' : 'Dark Mode'}
        </ActionButton>
      </Section>

      {/* ============ WEEKLY REVIEW ============ */}
      <Section
        icon={ClipboardCheck}
        title="Weekly Review"
        subtitle="Loop de revisión semanal del Execution OS"
      >
        <div className="space-y-2">
          <Row label="Reviews registradas">
            <span className="text-nexus-text font-mono font-semibold">{reviewLog?.length ?? 0}</span>
          </Row>
          <Row label="Última review">
            <span className="text-nexus-muted text-xs font-mono">
              {lastReviewAt ? new Date(lastReviewAt).toLocaleString('es-MX') : '—'}
            </span>
          </Row>
          <div className="pt-2">
            <ActionButton
              onClick={() => window.dispatchEvent(new CustomEvent('axis:review:open'))}
              icon={ClipboardCheck}
            >
              Abrir Weekly Review ahora
            </ActionButton>
          </div>
        </div>
      </Section>

      {/* ============ DATOS ============ */}
      <Section
        icon={Download}
        title="Datos"
        subtitle="Exporta, importa o limpia tu estado local"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionButton onClick={handleExport} icon={Download} block>
            Exportar snapshot (.json)
          </ActionButton>
          <ActionButton onClick={() => fileRef.current?.click()} icon={Upload} block>
            Importar snapshot (.json)
          </ActionButton>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
            aria-label="Seleccionar archivo de snapshot para importar"
          />
        </div>

        {importError && (
          <p className="mt-3 text-red-400 text-xs flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            {importError}
          </p>
        )}
        {importOk && (
          <p className="mt-3 text-nexus-green text-xs flex items-start gap-1.5">
            <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" />
            {importOk}
          </p>
        )}

        <div className="mt-5 pt-4 border-t border-nexus-border">
          <h4 className="text-red-400 text-xs font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Trash2 className="w-3 h-3" /> Zona destructiva
          </h4>
          <p className="text-nexus-muted text-xs mb-3">
            Borra todo el estado local del Execution OS: misiones, KRs, sprints, playbook, reviews. La acción NO se puede deshacer. Considera exportar primero.
          </p>
          <button
            onClick={handleReset}
            className={`px-4 py-2 rounded text-sm font-semibold transition-all flex items-center gap-2 ${
              confirmReset === 0
                ? 'bg-red-900/40 border border-red-700/60 text-red-300 hover:bg-red-900/60'
                : 'bg-red-600 text-white hover:bg-red-500'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {confirmReset === 0 ? 'Reset total del Execution OS' : 'Toca de nuevo para CONFIRMAR'}
          </button>
          {confirmReset === 1 && (
            <p className="text-yellow-400 text-[11px] mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Confirma en los próximos 5 segundos.
            </p>
          )}
        </div>
      </Section>

      {/* ============ SOBRE ============ */}
      <Section
        icon={SettingsIcon}
        title="Sobre AXIS"
        subtitle="Execution OS adaptativo"
      >
        <div className="space-y-1.5 text-xs font-mono text-nexus-muted">
          <div>Versión: <span className="text-nexus-text">{APP_VERSION}</span></div>
          <div>Modo persistencia: <span className="text-nexus-text">localStorage</span></div>
          <div>Construido para equipos ambiciosos. Turn intent into outcomes.</div>
        </div>
      </Section>
    </div>
  )
}

// ============================================================
// Subcomponentes internos
// ============================================================

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="surface-card p-5 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'rgba(91,141,239,0.10)', border: '1px solid rgba(91,141,239,0.25)' }}>
          <Icon className="w-4 h-4 text-blue-300" />
        </div>
        <div>
          <h2 className="text-nexus-text text-sm font-semibold">{title}</h2>
          <p className="text-nexus-muted text-[10px] font-mono">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-nexus-border/40 last:border-0">
      <span className="text-nexus-muted text-xs font-mono uppercase tracking-widest">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}

function ActionButton({ onClick, icon: Icon, children, block }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded text-xs font-mono font-medium border border-nexus-border text-nexus-text hover:border-blue-500/60 hover:text-blue-300 transition-all flex items-center gap-2 ${block ? 'w-full justify-center' : ''}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {children}
    </button>
  )
}

function ModeChip({ active, onClick, icon: Icon, label, hint }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 p-3 rounded-lg border transition-all text-left ${
        active
          ? 'border-blue-500 bg-blue-900/20'
          : 'border-nexus-border bg-nexus-bg/40 hover:border-blue-500/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-blue-400" />
        <span className="font-semibold text-nexus-text text-sm">{label}</span>
      </div>
      <p className="text-nexus-muted text-[11px]">{hint}</p>
    </button>
  )
}
