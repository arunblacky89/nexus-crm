import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, RefreshCw, Mail, Phone, Globe, MapPin, Star, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Lead, Activity } from '../../types'
import { formatDate, formatDateTime, LEAD_STATUS_COLORS, PRIORITY_COLORS, ACTIVITY_ICONS } from '../../utils'
import LeadFormModal from './LeadFormModal'
import ActivityTimeline from '../../components/shared/ActivityTimeline'
import ConvertLeadModal from './ConvertLeadModal'

export default function LeadDetailPage() {
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showConvert, setShowConvert] = useState(false)

  async function loadLead() {
    try {
      const res = await api.get(`/leads/?uuid=${uuid}`)
      const found = res.data.results?.[0]
      if (found) setLead(found)
      else {
        // Try by UUID directly
        const r2 = await api.get(`/leads/${uuid}/`)
        setLead(r2.data)
      }
    } catch {
      toast.error('Lead not found')
      navigate('/leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLead() }, [uuid])

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 skeleton" />
      <div className="card p-6 h-48 skeleton" />
    </div>
  )

  if (!lead) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/leads')} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="page-title">{lead.full_name}</h1>
          <p className="text-sm text-slate-500">{lead.company_name || lead.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {!lead.converted && (
            <button onClick={() => setShowConvert(true)} className="btn-secondary text-sm text-green-600 border-green-200 hover:bg-green-50">
              <Zap size={15} /> Convert
            </button>
          )}
          <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm">
            <Edit size={15} /> Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Timeline (left, wider) */}
        <div className="lg:col-span-3 space-y-4">
          <ActivityTimeline
            relatedLead={lead.id}
            entityType="lead"
          />
        </div>

        {/* Info panel (right) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status card */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className={LEAD_STATUS_COLORS[lead.status]}>{lead.status}</span>
              <span className={PRIORITY_COLORS[lead.priority]}>{lead.priority}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${lead.lead_score}%` }} />
              </div>
              <span className="text-sm font-semibold text-slate-700">{lead.lead_score}/100</span>
            </div>
            <p className="text-xs text-slate-400">Lead Score</p>
          </div>

          {/* Contact info */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Contact Info</h3>
            <div className="space-y-2.5">
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-slate-400" />
                  <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-slate-400" />
                  <a href={`tel:${lead.phone}`} className="text-slate-700">{lead.phone}</a>
                </div>
              )}
              {lead.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe size={14} className="text-slate-400" />
                  <a href={lead.website} target="_blank" className="text-blue-600 hover:underline">{lead.website}</a>
                </div>
              )}
              {(lead.city || lead.country) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="text-slate-700">{[lead.city, lead.state, lead.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Lead details */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Lead Details</h3>
            <div className="space-y-2">
              {[
                ['Source', lead.lead_source],
                ['Assigned To', lead.assigned_to_name || '—'],
                ['Created', formatDate(lead.created_at)],
                ['Updated', formatDate(lead.updated_at)],
                ...(lead.converted ? [['Converted', formatDateTime(lead.converted_at)]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-800 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {lead.tags_detail.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags_detail.map(tag => (
                  <span key={tag.id} className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: tag.color }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {lead.description && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{lead.description}</p>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <LeadFormModal lead={lead} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); loadLead() }} />
      )}
      {showConvert && (
        <ConvertLeadModal lead={lead} onClose={() => setShowConvert(false)} onConverted={() => { setShowConvert(false); loadLead() }} />
      )}
    </div>
  )
}
