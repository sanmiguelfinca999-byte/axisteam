import { Bell, X, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useNEXUS } from '../../context/NEXUSContext'

const NOTIF_ICONS = {
  REASIGNACION: <RefreshCw className="w-4 h-4 text-purple-400" />,
  CRISIS:       <AlertTriangle className="w-4 h-4 text-red-400 animate-blink" />,
  COMPLETADA:   <CheckCircle className="w-4 h-4 text-nexus-green" />,
}

export default function NotificationCenter() {
  const { notificaciones, marcarNotifLeida } = useNEXUS()
  const [open, setOpen] = useState(false)

  const unread = notificaciones.filter(n => !n.leida).length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-nexus-muted hover:text-nexus-text transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 z-40 hud-card border-nexus-border shadow-2xl overflow-hidden animate-fade-in"
            style={{ boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-nexus-border">
              <span className="text-nexus-text text-sm font-semibold">Notificaciones</span>
              <button onClick={() => setOpen(false)} className="text-nexus-muted hover:text-nexus-text">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-nexus-border/50">
              {notificaciones.length === 0 ? (
                <div className="py-8 text-center text-nexus-muted text-sm">Sin notificaciones</div>
              ) : notificaciones.map(n => (
                <div
                  key={n.id}
                  onClick={() => marcarNotifLeida(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-nexus-surface transition-colors ${
                    n.leida ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">{NOTIF_ICONS[n.tipo] || <Bell className="w-4 h-4 text-nexus-muted" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-nexus-text text-xs leading-relaxed">{n.mensaje}</p>
                    <p className="text-nexus-muted text-xs font-mono mt-0.5">
                      {new Date(n.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.leida && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
