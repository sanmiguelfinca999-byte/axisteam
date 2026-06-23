import { useMemo } from 'react'
import { Sparkles, Calendar, Flag, Hash, Check } from 'lucide-react'
import {
  suggestDueDate,
  suggestStoryPoints,
  suggestPriority,
} from '../../lib/smartDefaults'

/**
 * SmartSuggestionsRow — chips de sugerencias para el MissionComposer.
 *
 * No impone defaults: calcula sugerencias a partir del estado actual
 * del form y las ofrece como chips "click to apply". Si el valor actual
 * coincide con la sugerencia, no muestra el chip (evita ruido).
 *
 * Sugerencias:
 *   - Prioridad: por keywords en título (urgente/deadline/opcional)
 *   - Due date:  por prioridad (CRITICA +3d, ALTA +7, NORMAL +14, BAJA +30)
 *   - Story pts: Fibonacci según longitud descripción + bump CRITICA
 *
 * Combate decision fatigue al crear misiones (TDAH friendly).
 */

const PRIORIDAD_COLOR = {
  CRITICA: '#FF5470', ALTA: '#FFB547', NORMAL: '#5B8DEF', BAJA: '#7A8AB8',
}

export default function SmartSuggestionsRow({ form, onApply }) {
  const sugerencias = useMemo(() => {
    const out = []

    // Prioridad sugerida según keywords del título
    if (form.titulo && form.titulo.trim().length >= 3) {
      const sug = suggestPriority(form.titulo)
      if (sug !== form.prioridad) {
        out.push({
          key: 'prioridad',
          icon: Flag,
          label: 'prioridad',
          value: sug,
          display: sug,
          accent: PRIORIDAD_COLOR[sug] || '#5B8DEF',
          hint: 'detectada en el título',
        })
      }
    }

    // Due date sugerido según prioridad (calculado desde hoy)
    if (form.prioridad) {
      const sug = suggestDueDate(form.prioridad)
      const sugYMD = sug.slice(0, 10)
      if (sugYMD !== form.fechaLimite) {
        const days = ({ CRITICA: 3, ALTA: 7, NORMAL: 14, BAJA: 30 })[form.prioridad] ?? 7
        out.push({
          key: 'fechaLimite',
          icon: Calendar,
          label: 'fecha',
          value: sugYMD,
          display: new Date(sug).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
          accent: '#5B8DEF',
          hint: `+${days}d desde hoy`,
        })
      }
    }

    // Story points sugeridos por longitud + bump CRITICA
    if (form.descripcion !== undefined) {
      const sug = suggestStoryPoints(form.prioridad || 'NORMAL', form.descripcion || '')
      if (sug !== form.storyPoints) {
        out.push({
          key: 'storyPoints',
          icon: Hash,
          label: 'puntos',
          value: sug,
          display: String(sug),
          accent: '#22D3A8',
          hint: 'estimación Fibonacci',
        })
      }
    }

    return out
  }, [form])

  if (sugerencias.length === 0) return null

  return (
    <div className="mb-3 p-2.5 rounded-lg border border-blue-700/30 bg-blue-900/10">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3 h-3 text-blue-300" />
        <span className="text-blue-300 text-[10px] font-mono uppercase tracking-widest">Sugerencias del sistema</span>
        <span className="text-nexus-muted text-[10px] font-mono ml-auto">click para aplicar</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sugerencias.map(s => {
          const Icon = s.icon
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onApply(s.key, s.value)}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-mono transition-all hover:scale-[1.02]"
              style={{
                background: `${s.accent}15`,
                color: s.accent,
                borderColor: `${s.accent}55`,
              }}
              title={s.hint}
              aria-label={`Usar sugerencia para ${s.label}: ${s.display}`}
            >
              <Icon className="w-3 h-3" />
              <span className="text-nexus-text/85">{s.label}:</span>
              <strong>{s.display}</strong>
              <Check className="w-3 h-3 opacity-60" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
