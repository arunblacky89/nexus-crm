import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Globe, Phone, Mail, MapPin } from 'lucide-react'
import api from '../../services/api'
import type { Company } from '../../types'
import { formatCurrency, formatDate } from '../../utils'
import ActivityTimeline from '../../components/shared/ActivityTimeline'
import CompanyFormModal from './CompanyFormModal'

export default function CompanyDetailPage() {
  const { uuid } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  async function load() {
    try {
      const res = await api.get(`/companies/?search=${uuid}&page_size=1`)
      const found = res.data.results?.[0]
      if (found) setCompany(found)
      else navigate('/companies')
    } catch { navigate('/companies') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [uuid])

  if (loading) return <div className="h-64 skeleton animate-pulse" />
  if (!company) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/companies')} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="page-title">{company.name}</h1>
          <p className="text-sm text-slate-500">{company.industry} · {company.company_size}</p>
        </div>
        <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm"><Edit size={15} /> Edit</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <ActivityTimeline relatedCompany={company.id} entityType="company" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Company Info</h3>
            <div className="space-y-2.5 text-sm">
              {company.website && <div className="flex gap-2"><Globe size={14} className="text-slate-400 mt-0.5" /><a href={company.website} target="_blank" className="text-blue-600 truncate">{company.website}</a></div>}
              {company.phone && <div className="flex gap-2"><Phone size={14} className="text-slate-400 mt-0.5" /><span>{company.phone}</span></div>}
              {company.email && <div className="flex gap-2"><Mail size={14} className="text-slate-400 mt-0.5" /><span>{company.email}</span></div>}
              {company.city && <div className="flex gap-2"><MapPin size={14} className="text-slate-400 mt-0.5" /><span>{[company.city, company.state, company.country].filter(Boolean).join(', ')}</span></div>}
            </div>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Details</h3>
            {[
              ['Contacts', String(company.contact_count)],
              ['Deals', String(company.deal_count)],
              ...(company.annual_revenue ? [['Annual Revenue', formatCurrency(company.annual_revenue)]] : []),
              ['Created', formatDate(company.created_at)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 text-sm border-b border-slate-50 last:border-0">
                <span className="text-slate-500">{k}</span><span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showEdit && <CompanyFormModal company={company} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); load() }} />}
    </div>
  )
}
