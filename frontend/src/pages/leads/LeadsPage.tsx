import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  createColumnHelper, getCoreRowModel, useReactTable, flexRender
} from '@tanstack/react-table'
import { Plus, Search, Upload, Download, Trash2, UserCheck, Filter, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Lead, PaginatedResponse } from '../../types'
import { formatDate, LEAD_STATUS_COLORS, PRIORITY_COLORS } from '../../utils'
import LeadFormModal from './LeadFormModal'

const colHelper = createColumnHelper<Lead>()

const STATUSES = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Lost', 'Converted']
const SOURCES = ['Website', 'Cold Call', 'Email', 'LinkedIn', 'Referral', 'Trade Show', 'WhatsApp', 'Walk-in', 'Other']
const PRIORITIES = ['Low', 'Medium', 'High']

export default function LeadsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [showForm, setShowForm] = useState(searchParams.get('create') === '1')
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [filters, setFilters] = useState({ status: '', source: '', priority: '', assigned_to: '' })
  const [showFilters, setShowFilters] = useState(false)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: '25',
        ...(search && { search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.source && { lead_source: filters.source }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.assigned_to && { assigned_to: filters.assigned_to }),
      })
      const res = await api.get<PaginatedResponse<Lead>>(`/leads/?${params}`)
      setLeads(res.data.results)
      setTotal(res.data.count)
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [page, search, filters])

  useEffect(() => { loadLeads() }, [loadLeads])

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const toggleAll = () => {
    if (selected.size === leads.length) setSelected(new Set())
    else setSelected(new Set(leads.map(l => l.id)))
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selected.size} lead(s)?`)) return
    try {
      await api.post('/leads/bulk-delete/', { ids: Array.from(selected) })
      toast.success(`Deleted ${selected.size} leads`)
      setSelected(new Set())
      loadLeads()
    } catch {
      toast.error('Failed to delete')
    }
  }

  async function exportCSV() {
    try {
      const res = await api.get('/leads/export/', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'leads.csv'
      a.click()
    } catch {
      toast.error('Export failed')
    }
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/leads/import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success(`Imported ${res.data.created} leads. Errors: ${res.data.errors.length}`)
      loadLeads()
    } catch {
      toast.error('Import failed')
    }
    e.target.value = ''
  }

  const columns = [
    colHelper.display({
      id: 'select',
      header: () => <input type="checkbox" checked={selected.size === leads.length && leads.length > 0} onChange={toggleAll} className="rounded" />,
      cell: ({ row }) => <input type="checkbox" checked={selected.has(row.original.id)} onChange={() => toggleSelect(row.original.id)} className="rounded" onClick={e => e.stopPropagation()} />,
      size: 40,
    }),
    colHelper.accessor('full_name', {
      header: 'Name',
      cell: info => (
        <div>
          <p className="font-medium text-slate-800">{info.getValue()}</p>
          <p className="text-xs text-slate-400">{info.row.original.email}</p>
        </div>
      ),
    }),
    colHelper.accessor('company_name', { header: 'Company', cell: i => i.getValue() || '—' }),
    colHelper.accessor('phone', { header: 'Phone', cell: i => i.getValue() || '—' }),
    colHelper.accessor('lead_source', { header: 'Source', cell: i => <span className="badge-gray">{i.getValue()}</span> }),
    colHelper.accessor('status', {
      header: 'Status',
      cell: i => <span className={LEAD_STATUS_COLORS[i.getValue()]}>{i.getValue()}</span>,
    }),
    colHelper.accessor('priority', {
      header: 'Priority',
      cell: i => <span className={PRIORITY_COLORS[i.getValue()]}>{i.getValue()}</span>,
    }),
    colHelper.accessor('lead_score', {
      header: 'Score',
      cell: i => (
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${i.getValue()}%` }} />
          </div>
          <span className="text-xs text-slate-500">{i.getValue()}</span>
        </div>
      ),
    }),
    colHelper.accessor('assigned_to_name', { header: 'Assigned To', cell: i => i.getValue() || '—' }),
    colHelper.accessor('created_at', { header: 'Created', cell: i => formatDate(i.getValue()) }),
  ]

  const table = useReactTable({ data: leads, columns, getCoreRowModel: getCoreRowModel() })
  const totalPages = Math.ceil(total / 25)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="text-sm text-slate-500">{total} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="btn-secondary cursor-pointer text-sm">
            <Upload size={15} /> Import
            <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
          </label>
          <button onClick={exportCSV} className="btn-secondary text-sm">
            <Download size={15} /> Export
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* Search & filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search leads..."
            className="input pl-9"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary text-sm ${showFilters ? 'bg-slate-100' : ''}`}>
          <Filter size={15} /> Filters {Object.values(filters).some(Boolean) && <span className="w-2 h-2 rounded-full bg-blue-500 ml-1" />}
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="card p-4 flex flex-wrap gap-3">
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input w-36">
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))} className="input w-36">
            <option value="">All Sources</option>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))} className="input w-36">
            <option value="">All Priority</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          {Object.values(filters).some(Boolean) && (
            <button onClick={() => setFilters({ status: '', source: '', priority: '', assigned_to: '' })} className="btn-ghost text-sm text-red-500">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      )}

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="card p-3 flex items-center gap-3 bg-blue-50 border-blue-200">
          <span className="text-sm text-blue-700 font-medium">{selected.size} selected</span>
          <button onClick={bulkDelete} className="btn-danger text-xs py-1.5">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id} className="table-header">{flexRender(h.column.columnDef.header, h.getContext())}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} className="table-cell"><div className="h-4 skeleton" /></td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-slate-400 text-sm">
                    No leads found. <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline">Add your first lead</button>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/leads/${row.original.uuid}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="table-cell">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Form modal */}
      {(showForm || editLead) && (
        <LeadFormModal
          lead={editLead}
          onClose={() => { setShowForm(false); setEditLead(null) }}
          onSaved={() => { setShowForm(false); setEditLead(null); loadLeads() }}
        />
      )}
    </div>
  )
}
