import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Company } from '../../types'
import { formatCurrency } from '../../utils'
import CompanyFormModal from './CompanyFormModal'

export default function CompaniesPage() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<Company[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), ...(search && { search }) })
      const res = await api.get(`/companies/?${params}`)
      setCompanies(res.data.results)
      setTotal(res.data.count)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Companies</h1><p className="text-sm text-slate-500">{total} companies</p></div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm"><Plus size={15} /> Add Company</button>
      </div>
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search companies..." className="input pl-9" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="card p-5 h-32 skeleton animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map(c => (
            <div key={c.id} onClick={() => navigate(`/companies/${c.uuid}`)}
              className="card p-5 hover:shadow-md cursor-pointer transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Building2 size={18} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.industry || '—'} · {c.company_size || '—'}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span>{c.contact_count} contacts</span>
                <span>{c.deal_count} deals</span>
                {c.annual_revenue && <span>{formatCurrency(c.annual_revenue)} revenue</span>}
              </div>
              <p className="text-xs text-slate-400 mt-1">{[c.city, c.country].filter(Boolean).join(', ')}</p>
            </div>
          ))}
          {companies.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-400">No companies found.</div>
          )}
        </div>
      )}

      {showForm && <CompanyFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}
