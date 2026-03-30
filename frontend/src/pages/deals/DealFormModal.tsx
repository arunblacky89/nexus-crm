import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Deal, Pipeline } from '../../types'

interface Props { deal?: Deal | null; pipeline: Pipeline | null; onClose: () => void; onSaved: () => void }

export default function DealFormModal({ deal, pipeline, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])

  const { register, handleSubmit } = useForm({
    defaultValues: deal || {
      title: '', amount: 0, deal_type: 'New Business', status: 'Open',
      pipeline: pipeline?.id, stage: pipeline?.stages[0]?.id,
    }
  })

  useEffect(() => {
    Promise.all([
      api.get('/contacts/dropdown/'),
      api.get('/companies/dropdown/'),
    ]).then(([c, co]) => { setContacts(c.data); setCompanies(co.data) }).catch(() => {})
  }, [])

  async function onSubmit(data: any) {
    setSaving(true)
    try {
      deal ? await api.patch(`/deals/${deal.id}/`, data) : await api.post('/deals/', data)
      toast.success(deal ? 'Deal updated' : 'Deal created')
      onSaved()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{deal ? 'Edit Deal' : 'New Deal'}</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Deal Title *</label><input {...register('title', { required: true })} className="input" /></div>
            <div><label className="label">Amount (₹)</label><input {...register('amount', { valueAsNumber: true })} type="number" min={0} className="input" /></div>
            <div><label className="label">Deal Type</label>
              <select {...register('deal_type')} className="input">
                {['New Business', 'Renewal', 'Upsell', 'Cross-sell'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Stage</label>
              <select {...register('stage', { valueAsNumber: true })} className="input">
                {pipeline?.stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="label">Status</label>
              <select {...register('status')} className="input">
                {['Open', 'Won', 'Lost', 'On Hold'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Contact</label>
              <select {...register('contact', { valueAsNumber: true })} className="input">
                <option value="">— None —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">Company</label>
              <select {...register('company', { valueAsNumber: true })} className="input">
                <option value="">— None —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="label">Expected Close Date</label>
              <input {...register('expected_close_date')} type="date" className="input" /></div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : deal ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
