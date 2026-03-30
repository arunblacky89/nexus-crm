import { useEffect, useState } from 'react'
import { Plus, Phone, Calendar, CheckSquare, FileText, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Activity } from '../../types'
import { formatDateTime, ACTIVITY_ICONS } from '../../utils'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Call: <Phone size={14} />,
  Meeting: <Calendar size={14} />,
  Task: <CheckSquare size={14} />,
  Note: <FileText size={14} />,
  Email: <Mail size={14} />,
}

const TYPE_COLORS: Record<string, string> = {
  Call: 'bg-blue-100 text-blue-600',
  Meeting: 'bg-purple-100 text-purple-600',
  Task: 'bg-green-100 text-green-600',
  Note: 'bg-amber-100 text-amber-600',
  Email: 'bg-red-100 text-red-600',
}

interface Props {
  relatedLead?: number
  relatedContact?: number
  relatedDeal?: number
  relatedCompany?: number
  entityType: 'lead' | 'contact' | 'deal' | 'company'
}

export default function ActivityTimeline({ relatedLead, relatedContact, relatedDeal, relatedCompany, entityType }: Props) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addType, setAddType] = useState('Note')
  const [addTitle, setAddTitle] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addDue, setAddDue] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params: Record<string, any> = {}
      if (relatedLead) params.related_lead = relatedLead
      if (relatedContact) params.related_contact = relatedContact
      if (relatedDeal) params.related_deal = relatedDeal
      if (relatedCompany) params.related_company = relatedCompany

      const query = new URLSearchParams(params).toString()
      const res = await api.get(`/activities/?${query}&ordering=-created_at&page_size=50`)
      setActivities(res.data.results)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [relatedLead, relatedContact, relatedDeal, relatedCompany])

  async function addActivity() {
    if (!addTitle.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    try {
      await api.post('/activities/', {
        activity_type: addType,
        title: addTitle,
        description: addDesc,
        due_date: addDue || null,
        related_lead: relatedLead || null,
        related_contact: relatedContact || null,
        related_deal: relatedDeal || null,
        related_company: relatedCompany || null,
      })
      toast.success('Activity added')
      setShowAdd(false)
      setAddTitle('')
      setAddDesc('')
      setAddDue('')
      load()
    } catch {
      toast.error('Failed to add activity')
    }
    setSaving(false)
  }

  async function completeActivity(id: number) {
    try {
      await api.post(`/activities/${id}/complete/`)
      toast.success('Marked as complete')
      load()
    } catch {}
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">Activity Timeline</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-xs py-1.5">
          <Plus size={13} /> Add Activity
        </button>
      </div>

      {/* Quick add form */}
      {showAdd && (
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50">
          <div className="flex gap-2 flex-wrap">
            {['Note', 'Call', 'Meeting', 'Task', 'Email'].map(t => (
              <button
                key={t}
                onClick={() => setAddType(t)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${addType === t ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}
              >
                {ACTIVITY_ICONS[t]} {t}
              </button>
            ))}
          </div>
          <input value={addTitle} onChange={e => setAddTitle(e.target.value)} className="input" placeholder="Activity title *" />
          <textarea value={addDesc} onChange={e => setAddDesc(e.target.value)} className="input resize-none" rows={2} placeholder="Notes (optional)" />
          {addType !== 'Note' && (
            <input type="datetime-local" value={addDue} onChange={e => setAddDue(e.target.value)} className="input" />
          )}
          <div className="flex gap-2">
            <button onClick={addActivity} disabled={saving} className="btn-primary text-xs">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-xs">Cancel</button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="divide-y divide-slate-50">
        {loading ? (
          <div className="p-5 space-y-3">
            {Array(3).fill(0).map((_, i) => <div key={i} className="h-12 skeleton" />)}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No activities yet. Add your first activity above.
          </div>
        ) : (
          activities.map(a => (
            <div key={a.id} className="flex gap-3 px-5 py-4 hover:bg-slate-50 group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${TYPE_COLORS[a.activity_type]}`}>
                {TYPE_ICONS[a.activity_type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-medium ${a.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {a.title}
                    </p>
                    {a.description && <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>}
                  </div>
                  {!a.completed && (
                    <button
                      onClick={() => completeActivity(a.id)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-green-600 hover:underline shrink-0 transition-opacity"
                    >
                      Mark done
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-400">{formatDateTime(a.created_at)}</span>
                  {a.due_date && !a.completed && (
                    <span className={`text-xs ${new Date(a.due_date) < new Date() ? 'text-red-500' : 'text-amber-600'}`}>
                      Due: {formatDateTime(a.due_date)}
                    </span>
                  )}
                  {a.assigned_to_name && <span className="text-xs text-slate-400">by {a.assigned_to_name}</span>}
                  {a.completed && <span className="text-xs text-green-600">✓ Completed</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
