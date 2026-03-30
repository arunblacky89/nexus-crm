import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Contact } from '../../types'

interface Props {
  contact?: Contact | null
  onClose: () => void
  onSaved: () => void
}

export default function ContactFormModal({ contact, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const { register, handleSubmit } = useForm({ defaultValues: contact || { first_name: '', last_name: '', email: '', phone: '', job_title: '', department: '' } })

  useEffect(() => {
    api.get('/companies/dropdown/').then(r => setCompanies(r.data)).catch(() => {})
  }, [])

  async function onSubmit(data: any) {
    setSaving(true)
    try {
      contact ? await api.patch(`/contacts/${contact.id}/`, data) : await api.post('/contacts/', data)
      toast.success(contact ? 'Contact updated' : 'Contact created')
      onSaved()
    } catch { toast.error('Failed to save contact') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{contact ? 'Edit Contact' : 'Add Contact'}</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">First Name *</label><input {...register('first_name', { required: true })} className="input" /></div>
            <div><label className="label">Last Name</label><input {...register('last_name')} className="input" /></div>
            <div><label className="label">Email</label><input {...register('email')} type="email" className="input" /></div>
            <div><label className="label">Phone</label><input {...register('phone')} className="input" /></div>
            <div><label className="label">Mobile</label><input {...register('mobile')} className="input" /></div>
            <div><label className="label">WhatsApp</label><input {...register('whatsapp')} className="input" /></div>
            <div><label className="label">Job Title</label><input {...register('job_title')} className="input" /></div>
            <div><label className="label">Department</label><input {...register('department')} className="input" /></div>
            <div className="col-span-2">
              <label className="label">Company</label>
              <select {...register('company', { valueAsNumber: true })} className="input">
                <option value="">— No company —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : contact ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
