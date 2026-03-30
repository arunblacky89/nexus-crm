import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Lead } from '../../types'

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  company_name: z.string().optional(),
  job_title: z.string().optional(),
  lead_source: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigned_to: z.number().nullable().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  lead?: Lead | null
  onClose: () => void
  onSaved: () => void
}

export default function LeadFormModal({ lead, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<any[]>([])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: lead ? {
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      mobile: lead.mobile,
      company_name: lead.company_name,
      job_title: lead.job_title,
      lead_source: lead.lead_source,
      status: lead.status,
      priority: lead.priority,
      assigned_to: lead.assigned_to,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      description: lead.description,
    } : { status: 'New', priority: 'Medium', lead_source: 'Other' },
  })

  useEffect(() => {
    api.get('/auth/users/dropdown/').then(r => setUsers(r.data)).catch(() => {})
  }, [])

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      if (lead) {
        await api.patch(`/leads/${lead.id}/`, data)
        toast.success('Lead updated')
      } else {
        await api.post('/leads/', data)
        toast.success('Lead created')
      }
      onSaved()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save lead')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-800">{lead ? 'Edit Lead' : 'Add New Lead'}</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name *</label>
                <input {...register('first_name')} className="input" />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input {...register('last_name')} className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input {...register('email')} type="email" className="input" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Phone</label>
                <input {...register('phone')} className="input" />
              </div>
              <div>
                <label className="label">Mobile</label>
                <input {...register('mobile')} className="input" />
              </div>
              <div>
                <label className="label">Company Name</label>
                <input {...register('company_name')} className="input" />
              </div>
              <div>
                <label className="label">Job Title</label>
                <input {...register('job_title')} className="input" />
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Lead Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Lead Source</label>
                <select {...register('lead_source')} className="input">
                  {['Website', 'Cold Call', 'Email', 'LinkedIn', 'Referral', 'Trade Show', 'WhatsApp', 'Walk-in', 'Other'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select {...register('status')} className="input">
                  {['New', 'Contacted', 'Qualified', 'Unqualified', 'Lost', 'Converted'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select {...register('priority')} className="input">
                  {['Low', 'Medium', 'High'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Assigned To</label>
                <select {...register('assigned_to', { valueAsNumber: true })} className="input">
                  <option value="">— Select user —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Location</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">City</label>
                <input {...register('city')} className="input" />
              </div>
              <div>
                <label className="label">State</label>
                <input {...register('state')} className="input" />
              </div>
              <div>
                <label className="label">Country</label>
                <input {...register('country')} className="input" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={3} className="input resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
