import { useNEXUS } from '../../context/NEXUSContext'
import { Activity, AlertTriangle, Battery, BatteryLow, BatteryMedium, Flame, Sparkles, TrendingUp, TrendingDown, Minus, Zap, Pause, Lightbulb, MoveRight, CheckCircle2 } from 'lucide-react'

/**
 * InsightsPanel — Inteligencia operativa adaptativa.
 *
 * Lee `insights` del NEXUSContext y los renderiza como tarjetas accionables.
 * Cuatro semáforos principales:
 *   - Sobrecarga (NOMINAL / AMARILLO / ROJO)
 *   - Ritmo (ACELERANDO / SOSTENIDO / PLANO / DESACELERANDO)
 *   - Energía (ALTO / MEDIO / BAJO)
 *   - Streak (días consecutivos)
 *
 * Alertas accionables:
 *   - KRs estancados (sin avance >14 días)
 *   - Misiones sin movimiento (>5 días)
 */

const SOBRECARGA_STYLES = {
  ROJO:      { color: '#FF5470', icon: AlertTriangle, label: 'Sobrecarga crítica', hint: 'Más de 4 misiones críticas activas. Re-pacing necesario.' },
  AMARILLO:  { color: '#FFB547', icon: AlertTriangle, label: 'Carga elevada',      hint: '3-4 críticas activas. Vigila ritmo.' },
  NOMINAL:   { color: '#22D3A8', icon: CheckCircle2,  label: 'Carga sostenible',   hint: 'Críticas en rango operable.' },
}

const RITMO_STYLES = {
  ACELERANDO:     { color: '#22D3A8', icon: TrendingUp,   label: 'Acelerando',     hint: 'Cierras más de lo que abres.' },
  SOSTENIDO:      { color: '#5B8DEF', icon: Activity,     label: 'Sostenido',      hint: 'Ratio cierre/apertura sano.' },
  PLANO:          { color: '#7A8AB8', icon: Minus,        label: 'Plano',          hint: 'Sin movimiento esta semana.' },
  DESACELERANDO:  { color: '#FF5470', icon: TrendingDown, label: 'Desacelerando',  hint: 'Abres más rápido de lo que cierras.' },
}

const ENERGIA_STYLES = {
  ALTO:   { color: '#FFB547', icon: Zap,           label: 'Energía alta',  hint: 'Streak + ratio de cierre fuertes.' },
  MEDIO:  { color: '#5B8DEF', icon: BatteryMedium, label: 'Energía media', hint: 'Ritmo aceptable, espacio para subir.' },
  BAJO:   { color: '#7A8AB8', icon: BatteryLow,    label: 'Energía baja',  hint: 'Streak corta y ratio bajo. Pequeña victoria hoy.' },
}

const PRIORIDAD_COLOR = {
  CRITICA: '#FF5470', ALTA: '#FFB547', NORMAL: '#5B8DEF', BAJA: '#7A8AB8',
}

export default function InsightsPanel() {
  const { insights, streakActual, userPlaybook, axisMode } = useNEXUS()

  if (!insights) {
    return (
      <div className="h-full flex items-center justify-center text-nexus-muted font-mono text-sm p-8 text-center">
        <div>
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Sin datos suficientes para generar insights aún.</p>
        </div>
      </div>
    )
  }

  const sobre = SOBRECARGA_STYLES[insights.sobrecarga] || SOBRECARGA_STYLES.NOMINAL
  const ritmo = RITMO_STYLES[insights.ritmo] || RITMO_STYLES.PLANO
  const energia = ENERGIA_STYLES[insights.energia] || ENERGIA_STYLES.BAJO

  const acciones = generarAcciones(insights, streakActual)

  return (
    <div className="h-full overflow-y-auto p-4 max-w-5xl mx-auto">
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-nexus-text text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-300" />
            Insights
          </h1>
          <p className="text-nexus-muted text-xs font-mono">
            Inteligencia adaptativa del Execution OS{userPlaybook?.nombre ? ` · ${userPlaybook.nombre}` : ''}{axisMode === 'solo' ? ' · Solo Mode' : ' · Squad Mode'}
          </p>
        </div>
      </header>

      {/* Cuatro semáforos */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Semaforo style={sobre} value={`${insights.criticasActivas}/${insights.activasTotal}`} sublabel="críticas / activas" />
        <Semaforo style={ritmo} value={`${insights.completadasSemana} / ${insights.creadasSemana}`} sublabel="cerradas / abiertas (7d)" />
        <Semaforo style={energia} value={`x${insights.ratioCompletadasCreadas.toFixed(1)}`} sublabel="ratio de cierre" />
        <Semaforo
          style={{
            color: streakActual >= 7 ? '#FFB547' : streakActual > 0 ? '#5B8DEF' : '#7A8AB8',
            icon: Flame,
            label: streakActual >= 7 ? '🔥 Racha en marcha' : streakActual > 0 ? 'Racha activa' : 'Sin racha',
            hint: 'Días consecutivos cerrando misión.',
          }}
          value={streakActual}
          sublabel={streakActual === 1 ? 'día consecutivo' : 'días consecutivos'}
        />
      </section>

      {/* Acciones recomendadas */}
      <section className="mb-6">
        <h2 className="text-nexus-text text-sm font-semibold mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-blue-300" /> Acciones recomendadas
        </h2>
        {acciones.length === 0 ? (
          <div className="surface-card p-4 text-nexus-muted text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-nexus-green" />
            Sin alertas. Sigue así.
          </div>
        ) : (
          <ul className="space-y-2">
            {acciones.map((a, i) => (
              <li key={i} className={`surface-card p-3 border-l-4 flex items-start gap-3`} style={{ borderLeftColor: a.accent }}>
                <a.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: a.accent }} />
                <div className="flex-1">
                  <p className="text-nexus-text text-sm font-semibold">{a.titulo}</p>
                  <p className="text-nexus-muted text-xs mt-0.5">{a.detalle}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* KRs estancados */}
      {insights.krEstancados.length > 0 && (
        <section className="mb-6">
          <h2 className="text-nexus-text text-sm font-semibold mb-3 flex items-center gap-2">
            <Pause className="w-4 h-4 text-yellow-400" /> Key Results estancados ({insights.krEstancados.length})
          </h2>
          <ul className="space-y-2">
            {insights.krEstancados.map(k => (
              <li key={k.id} className="surface-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-nexus-text text-sm font-medium truncate">{k.titulo}</p>
                  <p className="text-nexus-muted text-[10px] font-mono">Progreso de la métrica: {k.pct}%</p>
                </div>
                <div className="w-24 bg-nexus-bg rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-yellow-500/70" style={{ width: `${k.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Misiones sin movimiento */}
      {insights.sinMovimiento.length > 0 && (
        <section>
          <h2 className="text-nexus-text text-sm font-semibold mb-3 flex items-center gap-2">
            <MoveRight className="w-4 h-4 text-blue-300" /> Sin movimiento (≥ 5 días)
          </h2>
          <ul className="space-y-2">
            {insights.sinMovimiento.map(t => (
              <li key={t.id} className="surface-card p-3 flex items-center gap-3">
                <span className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: PRIORIDAD_COLOR[t.prioridad] || '#5B8DEF' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-nexus-text text-sm font-medium truncate">{t.titulo}</p>
                  <p className="text-nexus-muted text-[10px] font-mono">{t.prioridad} · {t.diasSinTocar} días sin tocar</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Semaforo({ style, value, sublabel }) {
  const Icon = style.icon
  return (
    <div className="surface-card p-4">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: style.color }}>
        <Icon className="w-3.5 h-3.5" /> {style.label}
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color: style.color }}>{value}</div>
      <div className="text-nexus-muted text-[10px] font-mono">{sublabel}</div>
      <p className="text-nexus-muted text-[11px] mt-2 leading-snug">{style.hint}</p>
    </div>
  )
}

function generarAcciones(insights, streakActual) {
  const acc = []
  if (insights.sobrecarga === 'ROJO') {
    acc.push({
      titulo: 'Re-pacing inmediato',
      detalle: `Tienes ${insights.criticasActivas} críticas activas. Selecciona 1 para liberar foco; reasigna o pospón el resto.`,
      icon: AlertTriangle,
      accent: '#FF5470',
    })
  } else if (insights.sobrecarga === 'AMARILLO') {
    acc.push({
      titulo: 'Vigilar carga crítica',
      detalle: `${insights.criticasActivas} críticas en juego. Si añades otra, sube el riesgo de no cerrar ninguna.`,
      icon: AlertTriangle,
      accent: '#FFB547',
    })
  }
  if (insights.ritmo === 'DESACELERANDO') {
    acc.push({
      titulo: 'Estás abriendo más rápido de lo que cierras',
      detalle: 'Para de crear misiones nuevas hasta cerrar las que arrastras. Cierre > apertura es la única regla esta semana.',
      icon: TrendingDown,
      accent: '#FF5470',
    })
  }
  if (insights.ritmo === 'PLANO') {
    acc.push({
      titulo: 'Semana sin movimiento detectado',
      detalle: 'Cierra una misión chica hoy. La inercia se rompe con una victoria pequeña, no con una decisión grande.',
      icon: Pause,
      accent: '#5B8DEF',
    })
  }
  if (insights.energia === 'BAJO' && streakActual === 0) {
    acc.push({
      titulo: 'Reinicia la racha',
      detalle: 'Sin streak ni completion rate sano. Identifica la misión más pequeña que puedes cerrar HOY.',
      icon: Battery,
      accent: '#7A8AB8',
    })
  }
  if (insights.krEstancados.length > 0) {
    acc.push({
      titulo: `${insights.krEstancados.length} KR${insights.krEstancados.length !== 1 ? 's' : ''} sin avance`,
      detalle: 'Cada KR debería tener al menos una misión activa que lo mueva. Si no, replantéalo o ciérralo.',
      icon: Pause,
      accent: '#FFB547',
    })
  }
  if (insights.sinMovimiento.length >= 3) {
    acc.push({
      titulo: `${insights.sinMovimiento.length} misiones congeladas`,
      detalle: 'Más de 5 días sin tocar. Decisión por cada una: avanza, delega o ciérrala. Mantenerlas vivas es deuda mental.',
      icon: MoveRight,
      accent: '#FFB547',
    })
  }
  return acc
}
