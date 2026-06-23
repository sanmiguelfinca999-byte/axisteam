import { useState } from 'react'
import { Users, Activity, Shield } from 'lucide-react'
import CapacityView from './CapacityView'
import OperatorsAdmin from '../admin/OperatorsAdmin'

/**
 * TeamView — contenedor con tabs Capacity / Roster.
 * Director: ve ambas. Operator: solo vería Capacity (pero esta ruta es Director-only).
 */
export default function TeamView() {
  const [tab, setTab] = useState('capacity')

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-nexus-muted text-xs font-mono uppercase tracking-widest">
            <Users className="w-3 h-3" />Team Layer
          </div>
          <h1 className="text-nexus-text text-2xl font-bold mt-1">Equipo</h1>
          <p className="text-nexus-muted text-sm">Capacidad operativa actual y composición del roster.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-nexus-border flex items-center gap-1">
        <TabButton active={tab === 'capacity'} onClick={() => setTab('capacity')} icon={Activity} label="Capacity" />
        <TabButton active={tab === 'roster'}   onClick={() => setTab('roster')}   icon={Shield}   label="Roster" />
      </div>

      {/* Content */}
      <div>
        {tab === 'capacity' ? <CapacityViewBody /> : <OperatorsAdmin />}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 px-4 py-2 -mb-px border-b-2 text-xs font-mono uppercase tracking-widest transition-colors ${
        active
          ? 'border-blue-500 text-blue-300'
          : 'border-transparent text-nexus-muted hover:text-nexus-text'
      }`}>
      <Icon className="w-3.5 h-3.5" />{label}
    </button>
  )
}

// Wrapper de CapacityView sin su header propio (este componente ya tiene el header de Team)
function CapacityViewBody() {
  return (
    <div className="-mx-4 -my-4">
      <CapacityView />
    </div>
  )
}
