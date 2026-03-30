import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit } from 'lucide-react'
import api from '../../services/api'
import type { Deal } from '../../types'
import { formatCurrency, formatDate, DEAL_STATUS_COLORS } from '../../utils'
import ActivityTimeline from '../../components/shared/ActivityTimeline'
import DealFormModal from './DealFormModal'

export default function DealDetailPage() {
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  async function load() {
    try {
      const res = await api.get(`/deals/?search=${uuid}&page_size=1`)
      const found = res.data.results?.[0]
      if (found) setDeal(found)
      else navigate('/deals')
    } catch { navigate('/deals') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [uuid])
  if (loading) return <div className="h-64 skeleton animate-pulse" />
  if (!deal) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/deals')} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="page-title">{deal.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-lg font-bold text-green-600">{formatCurrency(deal.amount)}</span>
            <span className={DEAL_STATUS_COLORS[deal.status]}>{deal.status}</span>
            {deal.stage_name && <span className="badge-blue">{deal.stage_name}</span>}
          </div>
        </div>
        <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm"><Edit size={15} /> Edit</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <ActivityTimeline relatedDeal={deal.id} entityType="deal" />
          {deal.stage_history.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Stage History</h3>
              <div className="space-y-2">
                {deal.stage_history.map(h => (
                  <div key={h.id} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-slate-400">{new Date(h.changed_at).toLocaleDateString()}</span>
                    <span className="badge-gray">{h.from_stage_name || 'Start'}</span>
                    <span>→</span>
                    <span className="badge-blue">{h.to_stage_name}</span>
                    {h.changed_by_name && <span className="text-slate-400">by {h.changed_by_name}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Deal Info</h3>
            {[
              ['Type', deal.deal_type],
              ['Contact', deal.contact_name || '—'],
              ['Company', deal.company_name || '—'],
              ['Assigned To', deal.assigned_to_name || '—'],
              ['Expected Close', formatDate(deal.expected_close_date)],
              ...(deal.actual_close_date ? [['Actual Close', formatDate(deal.actual_close_date)]] : []),
              ['Probability', `${deal.stage_probability || 0}%`],
              ['Created', formatDate(deal.created_at)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 text-sm border-b border-slate-50 last:border-0">
                <span className="text-slate-500">{k}</span><span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          {deal.description && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
              <p className="text-sm text-slate-600">{deal.description}</p>
            </div>
          )}
        </div>
      </div>
      {showEdit && <DealFormModal deal={deal} pipeline={null} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); load() }} />}
    </div>
  )
}
