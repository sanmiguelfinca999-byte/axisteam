import { useEffect, useMemo, useState } from 'react'
import { useNEXUS } from '../../context/NEXUSContext'
import { Hand, X, ArrowRight, Sparkles } from 'lucide-react'

/**
 * WelcomeBackBanner — Continuidad emocional entre sesiones.
 *
 * Aparece UNA vez por sesión cuando:
 *   - Pasaron ≥ 24h desde el último login registrado.
 *   - El usuario tiene historial real (tasks/completadas).
 *
 * Mensaje compasivo (importante para perfiles TLP/ansiedad de
 * discontinuidad): "no perdiste nada, estamos donde lo dejaste".
 *
 * Muestra:
 *   - Días desde la última visita
 *   - Misiones que cerraste en los últimos 7 días
 *   - Última misión activa con progreso (si la hay)
 *
 * Persistencia:
 *   axis_last_login    -> ISO del último arranque visto
 *   axis_welcome_shown -> sessionStorage flag para que sólo aparezca
 *                         una vez por sesión de navegador
 */

const MS_DAY = 86_400_000
const STORAGE_LAST = 'axis_last_login'
const SESSION_SHOWN = 'axis_welcome_shown'

const PRIORIDAD_COLOR = {
  CRITICA: '#FF5470', ALTA: '#FFB547', NORMAL: '#5B8DEF', BAJA: '#7A8AB8',
}

export default function WelcomeBackBanner() {
  const { tasks, currentUser, axisMode } = useNEXUS()
  const [visible, setVisible] = useState(false)
  const [snapshot, setSnapshot] = useState(null)

  // En boot: comparar último login vs ahora
  useEffect(() => {
    if (!currentUser) return
    if (typeof window === 'undefined') return

    let alreadyShownThisSession = false
    try {
      alreadyShownThisSession = window.sessionStorage.getItem(SESSION_SHOWN) === '1'
    } catch { /* no-op */ }

    let lastLogin = null
    try { lastLogin = window.localStorage.getItem(STORAGE_LAST) } catch { /* no-op */ }

    const now = Date.now()
    const hoursSince = lastLogin
      ? (now - new Date(lastLogin).getTime()) / (60 * 60 * 1000)
      : null

    // Marcar el login actual SIEMPRE para futura referencia
    try { window.localStorage.setItem(STORAGE_LAST, new Date(now).toISOString()) } catch { /* no-op */ }

    // Solo mostrar si NO fue mostrado en esta sesión Y hay gap ≥ 24h
    if (!alreadyShownThisSession && hoursSince !== null && hoursSince >= 24) {
      setSnapshot({
        daysAgo: Math.floor(hoursSince / 24),
        hoursAgo: Math.floor(hoursSince),
      })
      setVisible(true)
      try { window.sessionStorage.setItem(SESSION_SHOWN, '1') } catch { /* no-op */ }
    }
  }, [currentUser])

  const stats = useMemo(() => {
    if (!visible || !currentUser) return null
    const scoped = axisMode === 'solo'
      ? tasks.filter(t => t.activoId === currentUser.id)
      : tasks
    const weekAgo = Date.now() - 7 * MS_DAY
    const completadasSemana = scoped.filter(t => {
      if (t.estado !== 'COMPLETADA') return false
      const ev = (t.eventos || []).find(e => e.tipo === 'COMPLETED' || e.tipo === 'COMPLETADA')
      const ts = ev?.timestamp ? new Date(ev.timestamp).getTime() : new Date(t.fechaLimite).getTime()
      return ts >= weekAgo
    })
    const ultimaActiva = scoped
      .filter(t => t.estado !== 'COMPLETADA' && (t.progreso ?? 0) > 0)
      .sort((a, b) => (b.progreso ?? 0) - (a.progreso ?? 0))[0]
    return {
      completadasSemana: completadasSemana.length,
      ultimaActiva,
    }
  }, [visible, tasks, currentUser, axisMode])

  if (!visible || !snapshot) return null

  const accentLast = stats?.ultimaActiva ? (PRIORIDAD_COLOR[stats.ultimaActiva.prioridad] || '#5B8DEF') : '#5B8DEF'

  const handleDismiss = () => setVisible(false)
  const handleContinuar = () => {
    handleDismiss()
    if (stats?.ultimaActiva) {
      window.dispatchEvent(new CustomEvent('axis:now:open', { detail: { tareaId: stats.ultimaActiva.id } }))
    }
  }

  return (
    <section
      role="region"
      aria-label="Bienvenida de regreso"
      className="surface-elevated mb-4 overflow-hidden"
      style={{
        borderColor: 'rgba(167,139,250,0.35)',
        background: 'linear-gradient(135deg, rgba(167,139,250,0.10), rgba(91,141,239,0.06))',
      }}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.45)' }}>
            <Hand className="w-4 h-4" style={{ color: '#C4B5FD' }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-nexus-text font-bold text-sm">Qué bueno verte de vuelta.</h2>
            <p className="text-nexus-muted text-[11px] font-mono">
              {snapshot.daysAgo >= 1
                ? `Pasaron ${snapshot.daysAgo} día${snapshot.daysAgo !== 1 ? 's' : ''} desde tu última sesión.`
                : `Pasaron ${snapshot.hoursAgo} h desde tu última sesión.`
              }
            </p>
          </div>
        </div>
        <button onClick={handleDismiss} aria-label="Cerrar bienvenida" className="text-nexus-muted hover:text-nexus-text p-1 rounded hover:bg-nexus-bg/60 transition-colors flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </header>

      <div className="px-4 pb-4">
        <p className="text-nexus-text text-sm mt-3 mb-3 leading-relaxed">
          <Sparkles className="w-3.5 h-3.5 inline-block mr-1 text-blue-300 -mt-0.5" />
          No perdiste nada. El sistema te esperó. Aquí está dónde lo dejamos:
        </p>

        {stats && (
          <div className="space-y-2 mb-3">
            <div className="surface-card p-2.5 flex items-center justify-between text-xs">
              <span className="text-nexus-muted">Cerraste en la última semana</span>
              <span className="text-nexus-text font-mono font-bold">
                {stats.completadasSemana} {stats.completadasSemana === 1 ? 'misión' : 'misiones'}
              </span>
            </div>

            {stats.ultimaActiva && (
              <div className="surface-card p-2.5 border-l-4" style={{ borderLeftColor: accentLast }}>
                <div className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-1">Misión en curso con más avance</div>
                <p className="text-nexus-text text-sm font-semibold leading-snug truncate">{stats.ultimaActiva.titulo}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 bg-nexus-bg rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${stats.ultimaActiva.progreso}%`, background: accentLast }} />
                  </div>
                  <span className="text-nexus-text font-mono text-xs font-bold">{stats.ultimaActiva.progreso}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {stats?.ultimaActiva ? (
            <button
              onClick={handleContinuar}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded font-semibold text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', boxShadow: '0 0 16px rgba(124,58,237,0.20)' }}
            >
              Continuar donde lo dejé
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2.5 rounded font-semibold text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed)' }}
            >
              Empezar el día
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="px-3 py-2.5 rounded text-xs font-mono text-nexus-muted hover:text-nexus-text border border-nexus-border hover:border-blue-500/50 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </section>
  )
}
