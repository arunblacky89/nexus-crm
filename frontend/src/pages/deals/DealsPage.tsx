import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, LayoutGrid, List } from 'lucide-react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable
} from '@dnd-kit/core'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Deal, Pipeline } from '../../types'
import { formatCurrency, formatDate, DEAL_STATUS_COLORS } from '../../utils'
import DealFormModal from './DealFormModal'

// ── Kanban Card ────────────────────────────────────────────────────────────────

function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(deal.id) })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow space-y-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <p className="text-sm font-medium text-slate-800 line-clamp-2">{deal.title}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-green-600">{formatCurrency(deal.amount)}</span>
        <span className="text-xs text-slate-400">{deal.stage_probability}%</span>
      </div>
      {deal.contact_name && <p className="text-xs text-slate-500">{deal.contact_name}</p>}
      {deal.expected_close_date && (
        <p className="text-xs text-slate-400">Close: {formatDate(deal.expected_close_date)}</p>
      )}
    </div>
  )
}

function KanbanColumn({ stage, deals, onDealClick }: { stage: any; deals: Deal[]; onDealClick: (deal: Deal) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: String(stage.id) })
  const totalValue = deals.reduce((sum, d) => sum + Number(d.amount), 0)

  return (
    <div className="flex flex-col min-w-64 max-w-64">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
          <span className="text-sm font-semibold text-slate-700">{stage.name}</span>
          <span className="badge-gray text-xs">{deals.length}</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">{formatCurrency(totalValue)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 min-h-32 p-2 rounded-xl transition-colors ${isOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : 'bg-slate-50'}`}
      >
        {deals.map(deal => (
          <DealCard key={deal.id} deal={deal} onClick={() => onDealClick(deal)} />
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DealsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(searchParams.get('create') === '1')
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, dRes] = await Promise.all([
        api.get('/deals/pipelines/?is_default=true'),
        api.get('/deals/?status=Open&page_size=200'),
      ])
      const pipelines = pRes.data.results || pRes.data
      setPipeline(Array.isArray(pipelines) ? pipelines[0] : pipelines)
      setDeals(dRes.data.results)
    } catch { toast.error('Failed to load deals') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function getDealsByStage(stageId: number) {
    return deals.filter(d => d.stage === stageId)
  }

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find(d => String(d.id) === String(event.active.id))
    setActiveDeal(deal || null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDeal(null)
    if (!over) return

    const dealId = Number(active.id)
    const newStageId = Number(over.id)
    const deal = deals.find(d => d.id === dealId)
    if (!deal || deal.stage === newStageId) return

    // Optimistic update
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStageId } : d))

    try {
      await api.post(`/deals/${dealId}/move-stage/`, { stage_id: newStageId })
      toast.success('Deal moved')
    } catch {
      toast.error('Failed to move deal')
      load() // Revert
    }
  }

  const totalOpen = deals.reduce((sum, d) => sum + Number(d.amount), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Deals</h1>
          <p className="text-sm text-slate-500">{deals.length} open deals · {formatCurrency(totalOpen)} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'kanban' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
              <LayoutGrid size={14} className="inline mr-1" /> Kanban
            </button>
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
              <List size={14} className="inline mr-1" /> List
            </button>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus size={15} /> Add Deal
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array(5).fill(0).map((_, i) => <div key={i} className="min-w-64 h-64 skeleton animate-pulse rounded-xl" />)}
        </div>
      ) : view === 'kanban' && pipeline ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {pipeline.stages.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={getDealsByStage(stage.id)}
                onDealClick={deal => navigate(`/deals/${deal.uuid}`)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDeal && (
              <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-xl w-60 opacity-90">
                <p className="text-sm font-medium">{activeDeal.title}</p>
                <p className="text-sm text-green-600 font-semibold">{formatCurrency(activeDeal.amount)}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        // List view
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                {['Title', 'Amount', 'Stage', 'Contact', 'Company', 'Close Date', 'Status'].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">No deals yet.</td></tr>
              ) : deals.map(d => (
                <tr key={d.id} onClick={() => navigate(`/deals/${d.uuid}`)} className="hover:bg-slate-50 cursor-pointer">
                  <td className="table-cell font-medium text-slate-800">{d.title}</td>
                  <td className="table-cell text-green-600 font-semibold">{formatCurrency(d.amount)}</td>
                  <td className="table-cell"><span className="badge-blue">{d.stage_name}</span></td>
                  <td className="table-cell">{d.contact_name || '—'}</td>
                  <td className="table-cell">{d.company_name || '—'}</td>
                  <td className="table-cell">{formatDate(d.expected_close_date)}</td>
                  <td className="table-cell"><span className={DEAL_STATUS_COLORS[d.status]}>{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <DealFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} pipeline={pipeline} />}
    </div>
  )
}
