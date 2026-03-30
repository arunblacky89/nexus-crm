import { useEffect, useState, useCallback } from 'react'
import { Plus, CheckCircle, Phone, Calendar, FileText, Mail, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Activity } from '../../types'
import { formatDateTime, ACTIVITY_ICONS } from '../../utils'

const TYPE_COLORS: Record<string, string> = {
  Call: 'bg-blue-100 text-blue-600', Meeting: 'bg-purple-100 text-purple-600',
  Task: 'bg-green-100 text-green-600', Note: 'bg-amber-100 text-amber-600', Email: 'bg-red-100 text-red-600',
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState('All')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        ordering: '-created_at',
        ...(tab !== 'All' && { activity_type: tab }),
      })
      const res = await api.get(`/activities/?${params}`)
      setActivities(res.data.results)
      setTotal(res.data.count)
    } catch { toast.error('Failed to load activities') }
    finally { setLoading(false) }
  }, [page, tab])

  useEffect(() => { load() }, [load])

  async function complete(id: number) {
    try {
      await api.post(`/activities/${id}/complete/`)
      toast.success('Marked complete')
      load()
    } catch {}
  }

  const TABS = ['All', 'Call', 'Meeting', 'Task', 'Note', 'Email']
  const totalPages = Math.ceil(total / 25)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Activities</h1><p className="text-sm text-slate-500">{total} activities</p></div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1) }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {ACTIVITY_ICONS[t] || ''} {t}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-slate-100">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="p-4 h-16 skeleton animate-pulse" />)
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No activities found.</div>
        ) : activities.map(a => (
          <div key={a.id} className={`flex items-start gap-3 p-4 hover:bg-slate-50 group ${a.completed ? 'opacity-60' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${TYPE_COLORS[a.activity_type]}`}>
              <span className="text-sm">{ACTIVITY_ICONS[a.activity_type]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${a.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{a.title}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-slate-400">{a.activity_type}</span>
                {a.due_date && (
                  <span className={`text-xs font-medium ${!a.completed && new Date(a.due_date) < new Date() ? 'text-red-500' : 'text-slate-500'}`}>
                    {!a.completed && new Date(a.due_date) < new Date() ? '⚠ Overdue: ' : 'Due: '}
                    {formatDateTime(a.due_date)}
                  </span>
                )}
                {a.assigned_to_name && <span className="text-xs text-slate-400">→ {a.assigned_to_name}</span>}
                {a.related_lead_name && <span className="text-xs text-blue-500">Lead: {a.related_lead_name}</span>}
                {a.related_contact_name && <span className="text-xs text-green-500">Contact: {a.related_contact_name}</span>}
                {a.related_deal_name && <span className="text-xs text-purple-500">Deal: {a.related_deal_name}</span>}
              </div>
              {a.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{a.description}</p>}
            </div>
            {!a.completed && (
              <button onClick={() => complete(a.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-green-600 hover:text-green-700 p-1"
                title="Mark complete">
                <CheckCircle size={18} />
              </button>
            )}
            {a.completed && <CheckCircle size={16} className="text-green-500 shrink-0" />}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs disabled:opacity-40">Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
