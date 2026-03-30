import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import type { Lead } from '../../types'

interface Props {
  lead: Lead
  onClose: () => void
  onConverted: () => void
}

export default function ConvertLeadModal({ lead, onClose, onConverted }: Props) {
  const navigate = useNavigate()
  const [createDeal, setCreateDeal] = useState(false)
  const [dealTitle, setDealTitle] = useState(`Deal - ${lead.full_name}`)
  const [dealAmount, setDealAmount] = useState(0)
  const [converting, setConverting] = useState(false)

  async function handleConvert() {
    setConverting(true)
    try {
      const res = await api.post(`/leads/${lead.id}/convert/`, {
        create_deal: createDeal,
        deal_title: dealTitle,
        deal_amount: dealAmount,
      })
      toast.success('Lead converted successfully!')
      onConverted()
      navigate(`/contacts/${res.data.contact_uuid}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Conversion failed')
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Convert Lead</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            Converting <strong>{lead.full_name}</strong> will create:
            <ul className="mt-1 ml-3 space-y-0.5 text-xs">
              <li>✓ Contact record</li>
              {lead.company_name && <li>✓ Company: {lead.company_name}</li>}
              {createDeal && <li>✓ New deal in pipeline</li>}
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="createDeal"
              checked={createDeal}
              onChange={e => setCreateDeal(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="createDeal" className="text-sm text-slate-700 cursor-pointer">
              Create a deal from this lead
            </label>
          </div>

          {createDeal && (
            <div className="space-y-3 pl-6 border-l-2 border-blue-200">
              <div>
                <label className="label">Deal Title</label>
                <input value={dealTitle} onChange={e => setDealTitle(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Deal Amount (₹)</label>
                <input type="number" value={dealAmount} onChange={e => setDealAmount(Number(e.target.value))} className="input" min={0} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleConvert} disabled={converting} className="btn-primary">
              <Zap size={15} />
              {converting ? 'Converting...' : 'Convert Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
