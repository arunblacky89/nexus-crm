import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Contact } from '../../types'
import { formatDate } from '../../utils'
import ContactFormModal from './ContactFormModal'
import ActivityTimeline from '../../components/shared/ActivityTimeline'

export default function ContactDetailPage() {
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  async function load() {
    try {
      const res = await api.get(`/contacts/?search=${uuid}&page_size=1`)
      const found = res.data.results?.[0]
      if (found) setContact(found)
      else navigate('/contacts')
    } catch { navigate('/contacts') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [uuid])

  if (loading) return <div className="h-64 skeleton animate-pulse" />
  if (!contact) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/contacts')} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="page-title">{contact.full_name}</h1>
          <p className="text-sm text-slate-500">{contact.job_title} {contact.company_detail ? `at ${contact.company_detail.name}` : ''}</p>
        </div>
        <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm"><Edit size={15} /> Edit</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <ActivityTimeline relatedContact={contact.id} entityType="contact" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Contact Info</h3>
            <div className="space-y-2.5">
              {contact.email && <div className="flex gap-2 text-sm"><Mail size={14} className="text-slate-400 mt-0.5" /><a href={`mailto:${contact.email}`} className="text-blue-600">{contact.email}</a></div>}
              {contact.phone && <div className="flex gap-2 text-sm"><Phone size={14} className="text-slate-400 mt-0.5" /><span>{contact.phone}</span></div>}
              {contact.company_detail && <div className="flex gap-2 text-sm"><Building2 size={14} className="text-slate-400 mt-0.5" /><button onClick={() => navigate(`/companies/${contact.company_detail?.uuid}`)} className="text-blue-600 hover:underline">{contact.company_detail.name}</button></div>}
              {contact.city && <div className="flex gap-2 text-sm"><MapPin size={14} className="text-slate-400 mt-0.5" /><span>{[contact.city, contact.country].filter(Boolean).join(', ')}</span></div>}
            </div>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Details</h3>
            {[['Assigned To', contact.assigned_to_name || '—'], ['Created', formatDate(contact.created_at)], ['Deals', String(contact.deal_count)]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 text-sm border-b border-slate-50 last:border-0">
                <span className="text-slate-500">{k}</span><span className="font-medium text-slate-800">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showEdit && <ContactFormModal contact={contact} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); load() }} />}
    </div>
  )
}
