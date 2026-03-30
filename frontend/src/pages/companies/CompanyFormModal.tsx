import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Company } from '../../types'

interface Props { company?: Company | null; onClose: () => void; onSaved: () => void }

const INDUSTRIES = ['Technology', 'Manufacturing', 'Healthcare', 'Finance', 'Retail', 'Real Estate', 'Education', 'Construction', 'Oil & Gas', 'Recruitment', 'Other']
const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+']

export default function CompanyFormModal({ company, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit } = useForm({ defaultValues: company || {} })

  async function onSubmit(data: any) {
    setSaving(true)
    try {
      company ? await api.patch(`/companies/${company.id}/`, data) : await api.post('/companies/', data)
      toast.success(company ? 'Company updated' : 'Company created')
      onSaved()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{company ? 'Edit Company' : 'Add Company'}</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Company Name *</label><input {...register('name', { required: true })} className="input" /></div>
            <div><label className="label">Website</label><input {...register('website')} type="url" className="input" /></div>
            <div><label className="label">Phone</label><input {...register('phone')} className="input" /></div>
            <div><label className="label">Email</label><input {...register('email')} type="email" className="input" /></div>
            <div><label className="label">Industry</label>
              <select {...register('industry')} className="input"><option value="">—</option>{INDUSTRIES.map(i => <option key={i}>{i}</option>)}</select>
            </div>
            <div><label className="label">Size</label>
              <select {...register('company_size')} className="input"><option value="">—</option>{SIZES.map(s => <option key={s}>{s}</option>)}</select>
            </div>
            <div><label className="label">Annual Revenue (₹)</label><input {...register('annual_revenue', { valueAsNumber: true })} type="number" className="input" /></div>
            <div><label className="label">City</label><input {...register('city')} className="input" /></div>
            <div><label className="label">Country</label><input {...register('country')} className="input" /></div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : company ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
