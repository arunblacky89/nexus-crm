import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createColumnHelper, getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import { Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Contact, PaginatedResponse } from '../../types'
import { formatDate } from '../../utils'
import ContactFormModal from './ContactFormModal'

const colHelper = createColumnHelper<Contact>()

export default function ContactsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(searchParams.get('create') === '1')

  const loadContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), ...(search && { search }) })
      const res = await api.get<PaginatedResponse<Contact>>(`/contacts/?${params}`)
      setContacts(res.data.results)
      setTotal(res.data.count)
    } catch { toast.error('Failed to load contacts') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { loadContacts() }, [loadContacts])

  const columns = [
    colHelper.accessor('full_name', {
      header: 'Name',
      cell: i => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-semibold">
            {i.getValue()[0]}
          </div>
          <div>
            <p className="font-medium text-slate-800">{i.getValue()}</p>
            <p className="text-xs text-slate-400">{i.row.original.email}</p>
          </div>
        </div>
      ),
    }),
    colHelper.accessor('company_detail', { header: 'Company', cell: i => i.getValue()?.name || '—' }),
    colHelper.accessor('job_title', { header: 'Job Title', cell: i => i.getValue() || '—' }),
    colHelper.accessor('phone', { header: 'Phone', cell: i => i.getValue() || '—' }),
    colHelper.accessor('deal_count', { header: 'Deals', cell: i => <span className="badge-blue">{i.getValue()}</span> }),
    colHelper.accessor('assigned_to_name', { header: 'Assigned To', cell: i => i.getValue() || '—' }),
    colHelper.accessor('created_at', { header: 'Created', cell: i => formatDate(i.getValue()) }),
  ]

  const table = useReactTable({ data: contacts, columns, getCoreRowModel: getCoreRowModel() })
  const totalPages = Math.ceil(total / 25)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="text-sm text-slate-500">{total} contacts</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus size={15} /> Add Contact
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search contacts..." className="input pl-9" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => <th key={h.id} className="table-header">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{columns.map((_, j) => <td key={j} className="table-cell"><div className="h-4 skeleton" /></td>)}</tr>
                ))
              ) : contacts.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-12 text-slate-400 text-sm">No contacts found.</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} onClick={() => navigate(`/contacts/${row.original.uuid}`)} className="hover:bg-slate-50 cursor-pointer">
                    {row.getVisibleCells().map(cell => <td key={cell.id} className="table-cell">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {showForm && <ContactFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadContacts() }} />}
    </div>
  )
}
