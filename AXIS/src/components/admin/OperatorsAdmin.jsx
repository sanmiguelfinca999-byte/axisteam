import { useState, useMemo } from 'react'
import { UserPlus, Users, Shield, Search, Activity } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'
import { MODE } from '../../lib/dataSource'
import InviteOperatorModal from './InviteOperatorModal'

/**
 * OperatorsAdmin — gestión del roster (solo Director).
 * En modo cloud: invitaciones via Edge Function.
 * En modo local: solo lista (sin invitaciones).
 */
export default function OperatorsAdmin() {
  const { activosConSalud, ACTIVOS_CREDENTIALS } = useNEXUS()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [query, setQuery] = useState('')

  const isCloud = MODE === 'supabase'

  const roster = useMemo(() => {
    const all = isCloud ? ACTIVOS_CREDENTIALS : ACTIVOS_CREDENTIALS
    const enriched = all.map(op => {
      const salud = activosConSalud.find(a => a.id === op.id)
      return { ...op, ...(salud ? {
        salud:       salud.salud,
        alertLevel:  salud.alertLevel,
        activas:     salud.activas,
        criticasCnt: salud.criticas,
      } : {}) }
    })
    if (!query.trim()) return enriched
    const q = query.toLowerCase()
    return enriched.filter(o =>
      o.codename?.toLowerCase().includes(q) ||
      o.nombre?.toLowerCase().includes(q) ||
      o.especialidad?.toLowerCase().includes(q)
    )
  }, [activosConSalud, ACTIVOS_CREDENTIALS, query, isCloud])

  return (
    <div className="space-y-4">
      {/* Header con búsqueda + invitar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nexus-muted" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar Operator por codename, nombre o especialidad..."
            aria-label="Buscar Operator"
            className="w-full bg-nexus-bg border border-nexus-border rounded-md pl-10 pr-4 py-2 text-nexus-text text-sm placeholder-nexus-muted/50 focus:outline-none focus:border-blue-500" />
        </div>
        {isCloud ? (
          <button onClick={() => setInviteOpen(true)}
            className="hud-btn-primary text-xs flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />Invitar Operator
          </button>
        ) : (
          <span className="text-xs font-mono text-nexus-muted bg-nexus-bg/40 border border-nexus-border/40 rounded px-3 py-1.5">
            Invitaciones requieren modo cloud (Supabase)
          </span>
        )}
      </div>

      {/* Tabla roster */}
      <div className="surface-elevated overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs font-mono uppercase tracking-widest text-nexus-muted border-b border-nexus-border">
            <tr>
              <th className="text-left py-3 px-3">Operator</th>
              <th className="text-left py-3 px-2">Especialidad</th>
              <th className="text-center py-3 px-2">Rol</th>
              <th className="text-center py-3 px-2">Estado</th>
              <th className="text-center py-3 px-2">Salud</th>
              <th className="text-center py-3 px-2">Activas</th>
            </tr>
          </thead>
          <tbody>
            {roster.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-nexus-muted text-sm">
                {query ? `Sin resultados para "${query}"` : 'Sin Operators en el roster.'}
              </td></tr>
            ) : roster.map(op => (
              <tr key={op.id} className="border-b border-nexus-border/40 hover:bg-nexus-bg/30 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{op.avatar}</span>
                    <div>
                      <div className="text-nexus-text font-medium">{op.codename}</div>
                      <div className="text-nexus-muted text-xs">{op.nombre}</div>
                    </div>
                  </div>
                </td>
                <td className="px-2 text-nexus-muted text-xs">{op.especialidad || '—'}</td>
                <td className="text-center px-2">
                  {op.roleSemantic === 'DIRECTOR' || op.role === 'CORONEL' ? (
                    <span className="inline-flex items-center gap-1 text-blue-300 text-xs font-mono px-2 py-0.5 rounded bg-blue-900/30 border border-blue-700/50">
                      <Shield className="w-3 h-3" />DIRECTOR
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-nexus-muted text-xs font-mono px-2 py-0.5 rounded bg-nexus-bg border border-nexus-border">
                      OPERATOR
                    </span>
                  )}
                </td>
                <td className="text-center px-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-mono ${
                    op.alertLevel === 'CHARLIE' ? 'text-red-400' :
                    op.alertLevel === 'BRAVO'   ? 'text-yellow-300' : 'text-nexus-green'
                  }`}>
                    <span className={`status-dot ${
                      op.alertLevel === 'CHARLIE' ? 'bg-red-500 animate-blink' :
                      op.alertLevel === 'BRAVO'   ? 'bg-yellow-500' : 'bg-nexus-green'
                    }`} />
                    {op.alertLevel === 'CHARLIE' ? 'Crisis' : op.alertLevel === 'BRAVO' ? 'Sobrecarga' : 'Operativo'}
                  </span>
                </td>
                <td className="text-center px-2 font-mono">
                  <span className={
                    op.alertLevel === 'CHARLIE' ? 'text-red-400 font-bold' :
                    op.alertLevel === 'BRAVO'   ? 'text-yellow-300' : 'text-nexus-green'
                  }>{op.salud ?? '—'}{op.salud != null && '%'}</span>
                </td>
                <td className="text-center px-2 text-nexus-text font-mono">{op.activas ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer hint */}
      <div className="flex items-center gap-2 text-xs text-nexus-muted bg-nexus-bg/40 border border-nexus-border/40 rounded p-2.5">
        <Activity className="w-3 h-3 flex-shrink-0" />
        <span>El roster se sincroniza en tiempo real. Al invitar un Operator, recibirá un correo para definir su clave.</span>
      </div>

      <InviteOperatorModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => {/* realtime subscription a operators actualizará automáticamente */}}
      />
    </div>
  )
}
