import { TrendingUp, Users, AlertTriangle, CheckCircle, FileText, Zap } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'

function KPICard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    green:  { text: 'text-nexus-green',   border: 'border-nexus-green/30',   bg: 'bg-nexus-green/10'   },
    red:    { text: 'text-red-400',        border: 'border-red-500/30',        bg: 'bg-red-900/20'       },
    yellow: { text: 'text-yellow-400',     border: 'border-yellow-500/30',     bg: 'bg-yellow-900/20'    },
    blue:   { text: 'text-blue-400',       border: 'border-blue-500/30',       bg: 'bg-blue-900/20'      },
    purple: { text: 'text-purple-400',     border: 'border-purple-500/30',     bg: 'bg-purple-900/20'    },
    muted:  { text: 'text-nexus-muted',    border: 'border-nexus-border',      bg: 'bg-nexus-bg'         },
  }
  const s = colors[color] || colors.muted

  return (
    <div className={`hud-card p-4 border ${s.border} ${s.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${s.text}`} />
        <span className="text-nexus-muted text-xs font-mono">{label}</span>
      </div>
      <div className={`text-3xl font-bold font-mono ${s.text}`}>{value}</div>
      {sub && <div className="text-nexus-muted text-xs mt-1">{sub}</div>}
    </div>
  )
}

export default function DashboardMetrics() {
  const { metricas, detectarCrisis, historialReasig } = useNEXUS()
  const activos = detectarCrisis()

  const pcCompletion = metricas.totalTareas > 0
    ? Math.round((metricas.completadas / metricas.totalTareas) * 100)
    : 0

  const avgSalud = Math.round(activos.reduce((s, a) => s + a.salud, 0) / activos.length)

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-blue-400" />
        <h2 className="text-nexus-text font-bold text-sm tracking-widest uppercase">Panel de Métricas Ejecutivo</h2>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KPICard icon={CheckCircle} label="Completadas" value={`${pcCompletion}%`}
          sub={`${metricas.completadas} de ${metricas.totalTareas} tareas`} color="green" />
        <KPICard icon={AlertTriangle} label="En Crisis"  value={metricas.enCrisis}
          sub="Activos nivel CHARLIE" color={metricas.enCrisis > 0 ? 'red' : 'green'} />
        <KPICard icon={Zap} label="Sobrecarga"  value={metricas.enSobrecarga}
          sub="Activos nivel BRAVO" color={metricas.enSobrecarga > 0 ? 'yellow' : 'green'} />
        <KPICard icon={AlertTriangle} label="Misiones Críticas" value={metricas.criticas}
          sub="Sin completar" color={metricas.criticas > 3 ? 'red' : 'yellow'} />
        <KPICard icon={FileText} label="SIRs Pendientes" value={metricas.sirsPendientes}
          sub="Sin leer" color={metricas.sirsPendientes > 0 ? 'purple' : 'muted'} />
        <KPICard icon={Users} label="Salud Promedio" value={`${avgSalud}%`}
          sub="Todos los activos" color={avgSalud >= 70 ? 'green' : avgSalud >= 40 ? 'yellow' : 'red'} />
      </div>

      {/* Status table */}
      <div className="hud-card overflow-hidden">
        <div className="px-4 py-2 border-b border-nexus-border">
          <span className="text-nexus-muted text-xs font-mono uppercase tracking-widest">Estado de Activos</span>
        </div>
        <div className="divide-y divide-nexus-border/50">
          {activos.map(a => (
            <div key={a.id} className="flex items-center justify-between px-4 py-2 hover:bg-nexus-surface/50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-base">{a.avatar}</span>
                <div>
                  <span className="text-nexus-text text-sm">{a.codename}</span>
                  <span className="text-nexus-muted text-xs ml-2">· {a.nombre}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-nexus-muted">{a.activas ?? 0} act.</span>
                <span className={
                  a.alertLevel === 'CHARLIE' ? 'text-red-400 font-bold' :
                  a.alertLevel === 'BRAVO'   ? 'text-yellow-400' : 'text-nexus-green'
                }>{a.nivel}</span>
                <span className={
                  a.color === 'red' ? 'text-red-400' : a.color === 'yellow' ? 'text-yellow-400' : 'text-nexus-green'
                }>{a.salud}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historial reasignaciones */}
      {historialReasig.length > 0 && (
        <div className="hud-card overflow-hidden">
          <div className="px-4 py-2 border-b border-nexus-border">
            <span className="text-nexus-muted text-xs font-mono uppercase tracking-widest">Últimas Reasignaciones</span>
          </div>
          <div className="divide-y divide-nexus-border/50">
            {historialReasig.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2 text-xs">
                <div>
                  <span className="text-nexus-text font-medium truncate block max-w-[200px]">{r.tareaTitulo}</span>
                  <span className="text-nexus-muted font-mono">{r.activoOrigen} → {r.activoDestino}</span>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-mono">{r.sirId}</div>
                  <div className="text-nexus-muted">{new Date(r.timestamp).toLocaleDateString('es-MX')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
