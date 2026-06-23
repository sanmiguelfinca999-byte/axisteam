import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, LayoutGrid, Target, FileText, TrendingUp, Users, User, Plus, Sparkles, ChevronRight } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'

/**
 * CommandPalette — atajo Cmd+K (Ctrl+K en Windows/Linux).
 * Fuzzy search sobre vistas, Operators, misiones y acciones rápidas.
 */
export default function CommandPalette({ open, onClose, onCompose }) {
  const { isDirector, activosConSalud, tasks, setActiveView, setSelectedActivoId, currentUser } = useNEXUS()
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef(null)

  // Construir lista de items navegables
  const allItems = useMemo(() => {
    const items = []
    if (isDirector) {
      items.push(
        { id: 'view:hud',      type: 'view', icon: LayoutGrid, label: 'Command',  hint: 'Grid de Operators',         onActivate: () => setActiveView('hud') },
        { id: 'view:strategy', type: 'view', icon: Target,     label: 'Strategy', hint: 'Árbol de OKRs',             onActivate: () => setActiveView('strategy') },
        { id: 'view:team',     type: 'view', icon: Users,      label: 'Team',     hint: 'Capacity por Operator',      onActivate: () => setActiveView('team') },
        { id: 'view:sirs',     type: 'view', icon: FileText,   label: 'Briefs',   hint: 'Historial de Mission Briefs', onActivate: () => setActiveView('sirs') },
        { id: 'view:metrics',  type: 'view', icon: TrendingUp, label: 'Insights', hint: 'Métricas agregadas',         onActivate: () => setActiveView('metrics') },
        { id: 'action:new-mission', type: 'action', icon: Plus, label: 'Nueva misión', hint: 'Atajo N', onActivate: () => onCompose && onCompose() },
      )
      activosConSalud.forEach(op => {
        items.push({
          id: `op:${op.id}`,
          type: 'operator',
          icon: User,
          label: op.codename,
          hint: `${op.nombre} · ${op.especialidad} · salud ${op.salud}%`,
          alertLevel: op.alertLevel,
          onActivate: () => { setSelectedActivoId(op.id); setActiveView('hud') },
        })
      })
      tasks.slice(0, 50).forEach(t => {
        items.push({
          id: `task:${t.id}`,
          type: 'mission',
          icon: Sparkles,
          label: t.titulo,
          hint: `${t.prioridad} · ${t.progreso}% · ${t.id}`,
          prioridad: t.prioridad,
          onActivate: () => {
            const op = activosConSalud.find(a => a.id === t.activoId)
            if (op) { setSelectedActivoId(op.id); setActiveView('hud') }
          },
        })
      })
    }
    return items
  }, [isDirector, activosConSalud, tasks, setActiveView, setSelectedActivoId, onCompose])

  // Fuzzy filter (no librería, simple includes case-insensitive)
  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 12)
    const q = query.toLowerCase()
    const matches = []
    for (const it of allItems) {
      const haystack = `${it.label} ${it.hint}`.toLowerCase()
      if (haystack.includes(q)) matches.push(it)
      if (matches.length >= 30) break
    }
    return matches
  }, [query, allItems])

  // Reset highlight cuando filtered cambia
  useEffect(() => { setHighlight(0) }, [query])

  // Foco al abrir
  useEffect(() => {
    if (!open) return
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  // Atajos de teclado en navegación
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight(h => Math.min(filtered.length - 1, h + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight(h => Math.max(0, h - 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = filtered[highlight]
        if (item) { item.onActivate(); onClose() }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, highlight, onClose])

  if (!open || !currentUser) return null

  // Agrupar por tipo
  const groups = filtered.reduce((acc, it) => {
    if (!acc[it.type]) acc[it.type] = []
    acc[it.type].push(it)
    return acc
  }, {})

  const groupOrder = ['view', 'action', 'operator', 'mission']
  const groupLabels = {
    view: 'Vistas',
    action: 'Acciones',
    operator: 'Operators',
    mission: 'Misiones',
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] p-4" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl surface-floating animate-fade-in flex flex-col max-h-[70vh]">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-nexus-border/40 flex-shrink-0">
          <Search className="w-4 h-4 text-nexus-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar vista, Operator, misión..."
            aria-label="Búsqueda"
            className="flex-1 bg-transparent text-nexus-text placeholder-nexus-muted/50 focus:outline-none font-mono text-sm"
          />
          <kbd className="text-[10px] text-nexus-muted font-mono bg-nexus-bg/60 border border-nexus-border px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-nexus-muted text-sm">Sin resultados para "{query}"</div>
          ) : groupOrder.filter(g => groups[g]?.length).map(group => (
            <div key={group} className="mb-2">
              <div className="px-4 py-1 text-[10px] font-mono uppercase tracking-widest text-nexus-muted">
                {groupLabels[group]}
              </div>
              {groups[group].map((item) => {
                const globalIdx = filtered.indexOf(item)
                const isActive = globalIdx === highlight
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => { item.onActivate(); onClose() }}
                    onMouseEnter={() => setHighlight(globalIdx)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                      isActive ? 'bg-blue-600/20 text-nexus-text' : 'text-nexus-text/80 hover:bg-nexus-bg/40'
                    }`}>
                    <Icon className={`w-4 h-4 flex-shrink-0 ${
                      item.alertLevel === 'CHARLIE' ? 'text-red-400' :
                      item.alertLevel === 'BRAVO'   ? 'text-yellow-400' :
                      item.prioridad === 'CRITICA'  ? 'text-red-400' :
                      item.prioridad === 'ALTA'     ? 'text-yellow-400' :
                      isActive ? 'text-blue-300' : 'text-nexus-muted'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.label}</div>
                      <div className="text-xs text-nexus-muted truncate">{item.hint}</div>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-blue-300 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-nexus-border/40 text-[10px] font-mono text-nexus-muted flex-shrink-0">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-nexus-bg/60 border border-nexus-border px-1 rounded">↑↓</kbd> navegar</span>
            <span><kbd className="bg-nexus-bg/60 border border-nexus-border px-1 rounded">↵</kbd> abrir</span>
            <span><kbd className="bg-nexus-bg/60 border border-nexus-border px-1 rounded">ESC</kbd> cerrar</span>
          </div>
          <span>{filtered.length} resultado{filtered.length !== 1 && 's'}</span>
        </div>
      </div>
    </div>
  )
}
