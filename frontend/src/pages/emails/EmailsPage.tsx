import { useEffect, useState } from 'react'
import { Plus, Send, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { EmailTemplate } from '../../types'
import { formatDate } from '../../utils'

export default function EmailsPage() {
  const [tab, setTab] = useState<'templates' | 'logs'>('templates')
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null)

  async function loadTemplates() {
    const res = await api.get('/emails/templates/?ordering=name')
    setTemplates(res.data.results)
  }

  async function loadLogs() {
    const res = await api.get('/emails/logs/?ordering=-sent_at')
    setLogs(res.data.results)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadTemplates(), loadLogs()]).finally(() => setLoading(false))
  }, [])

  const STATUS_COLORS: Record<string, string> = {
    Sent: 'badge-green', Failed: 'badge-red', Opened: 'badge-blue', Bounced: 'badge-yellow',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Email</h1>
        {tab === 'templates' && (
          <button onClick={() => { setEditTemplate(null); setShowForm(true) }} className="btn-primary text-sm">
            <Plus size={15} /> New Template
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {(['templates', 'logs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
            {t === 'templates' ? '📄 Templates' : '📧 Sent Logs'}
          </button>
        ))}
      </div>

      {tab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="card p-4 h-32 skeleton animate-pulse" />) :
            templates.length === 0 ? <div className="col-span-3 text-center py-12 text-slate-400">No templates yet.</div> :
            templates.map(t => (
              <div key={t.id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setEditTemplate(t); setShowForm(true) }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Mail size={15} className="text-blue-600" />
                  </div>
                  {t.category && <span className="badge-gray text-xs">{t.category}</span>}
                </div>
                <h3 className="font-semibold text-slate-800 text-sm mt-2">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.subject}</p>
                <p className="text-xs text-slate-400 mt-2">{formatDate(t.created_at)}</p>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'logs' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>{['To', 'Subject', 'Status', 'Sent At', 'Sent By'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? Array(5).fill(0).map((_, i) => <tr key={i}>{Array(5).fill(0).map((_, j) => <td key={j} className="table-cell"><div className="h-4 skeleton" /></td>)}</tr>) :
                logs.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">No emails sent yet.</td></tr> :
                logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="table-cell">{l.to_email}</td>
                    <td className="table-cell truncate max-w-xs">{l.subject}</td>
                    <td className="table-cell"><span className={STATUS_COLORS[l.status] || 'badge-gray'}>{l.status}</span></td>
                    <td className="table-cell">{formatDate(l.sent_at)}</td>
                    <td className="table-cell">{l.sent_by || '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {showForm && <TemplateFormModal template={editTemplate} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadTemplates() }} />}
    </div>
  )
}

function TemplateFormModal({ template, onClose, onSaved }: { template: EmailTemplate | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(template?.name || '')
  const [subject, setSubject] = useState(template?.subject || '')
  const [body, setBody] = useState(template?.body || '')
  const [category, setCategory] = useState(template?.category || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name || !subject || !body) { toast.error('Name, subject and body required'); return }
    setSaving(true)
    try {
      const data = { name, subject, body, category }
      template ? await api.patch(`/emails/templates/${template.id}/`, data) : await api.post('/emails/templates/', data)
      toast.success(template ? 'Template updated' : 'Template created')
      onSaved()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{template ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose} className="btn-ghost p-2">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="label">Template Name *</label><input value={name} onChange={e => setName(e.target.value)} className="input" /></div>
          <div><label className="label">Category</label><input value={category} onChange={e => setCategory(e.target.value)} className="input" placeholder="e.g. Follow-up, Welcome, Proposal" /></div>
          <div><label className="label">Subject *</label><input value={subject} onChange={e => setSubject(e.target.value)} className="input" /></div>
          <div><label className="label">Body (HTML) *</label><textarea value={body} onChange={e => setBody(e.target.value)} rows={10} className="input font-mono text-xs resize-y" placeholder="<p>Dear {{name}},</p>" /></div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Template'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
