import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState('profile')

  const TABS = [
    { id: 'profile', label: 'My Profile' },
    { id: 'users', label: 'Users' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'tags', label: 'Tags' },
  ]

  return (
    <div className="space-y-4">
      <h1 className="page-title">Settings</h1>
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'pipeline' && <PipelineTab />}
      {tab === 'tags' && <TagsTab />}
    </div>
  )
}

function ProfileTab() {
  const { user, setUser } = useAuthStore()
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [changingPwd, setChangingPwd] = useState(false)

  async function saveProfile() {
    setSaving(true)
    try {
      const res = await api.patch('/auth/me/', { first_name: firstName, last_name: lastName, phone })
      setUser(res.data)
      toast.success('Profile updated')
    } catch { toast.error('Failed to update') }
    finally { setSaving(false) }
  }

  async function changePassword() {
    if (!oldPwd || !newPwd) { toast.error('Enter both passwords'); return }
    setChangingPwd(true)
    try {
      await api.post('/auth/change-password/', { old_password: oldPwd, new_password: newPwd })
      toast.success('Password changed')
      setOldPwd(''); setNewPwd('')
    } catch (e: any) { toast.error(e.response?.data?.old_password?.[0] || 'Failed') }
    finally { setChangingPwd(false) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">First Name</label><input value={firstName} onChange={e => setFirstName(e.target.value)} className="input" /></div>
          <div><label className="label">Last Name</label><input value={lastName} onChange={e => setLastName(e.target.value)} className="input" /></div>
          <div className="col-span-2"><label className="label">Email</label><input value={user?.email} className="input bg-slate-50" readOnly /></div>
          <div><label className="label">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="input" /></div>
          <div><label className="label">Role</label><input value={user?.role?.replace('_', ' ')} className="input bg-slate-50 capitalize" readOnly /></div>
        </div>
        <button onClick={saveProfile} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save Profile'}</button>
      </div>
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Change Password</h3>
        <div><label className="label">Current Password</label><input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} className="input" /></div>
        <div><label className="label">New Password</label><input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="input" /></div>
        <button onClick={changePassword} disabled={changingPwd} className="btn-primary text-sm">{changingPwd ? 'Changing...' : 'Change Password'}</button>
      </div>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/users/').then(r => setUsers(r.data.results || r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const ROLE_COLORS: Record<string, string> = {
    super_admin: 'badge-red', admin: 'badge-purple', manager: 'badge-blue', sales_rep: 'badge-green', viewer: 'badge-gray',
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">All Users</h3>
      </div>
      <table className="w-full">
        <thead><tr>{['Name', 'Email', 'Role', 'Team', 'Status'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
        <tbody>
          {loading ? Array(3).fill(0).map((_, i) => <tr key={i}>{Array(5).fill(0).map((_, j) => <td key={j} className="table-cell"><div className="h-4 skeleton" /></td>)}</tr>) :
            users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="table-cell font-medium">{u.full_name}</td>
                <td className="table-cell text-slate-500">{u.email}</td>
                <td className="table-cell"><span className={ROLE_COLORS[u.role] || 'badge-gray'}>{u.role?.replace('_', ' ')}</span></td>
                <td className="table-cell">{u.team_name || '—'}</td>
                <td className="table-cell"><span className={u.is_active ? 'badge-green' : 'badge-red'}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

function PipelineTab() {
  const [pipelines, setPipelines] = useState<any[]>([])

  useEffect(() => {
    api.get('/deals/pipelines/').then(r => setPipelines(r.data.results || r.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      {pipelines.map(p => (
        <div key={p.id} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">{p.name} {p.is_default && <span className="badge-green text-xs ml-2">Default</span>}</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {p.stages?.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-sm text-slate-700">{s.name}</span>
                <span className="text-xs text-slate-400">{s.probability}%</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {pipelines.length === 0 && <div className="card p-8 text-center text-slate-400 text-sm">No pipelines configured. Run <code className="bg-slate-100 px-1.5 py-0.5 rounded">python manage.py seed_crm</code> to create the default pipeline.</div>}
    </div>
  )
}

function TagsTab() {
  const [tags, setTags] = useState<any[]>([])
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [saving, setSaving] = useState(false)

  function loadTags() {
    api.get('/settings/tags/').then(r => setTags(r.data.results || r.data)).catch(() => {})
  }

  useEffect(() => { loadTags() }, [])

  async function addTag() {
    if (!name) { toast.error('Tag name required'); return }
    setSaving(true)
    try {
      await api.post('/settings/tags/', { name, color })
      toast.success('Tag created')
      setName(''); loadTags()
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  async function deleteTag(id: number) {
    if (!confirm('Delete this tag?')) return
    try {
      await api.delete(`/settings/tags/${id}/`)
      toast.success('Tag deleted')
      loadTags()
    } catch {}
  }

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">Tags</h3>
      <div className="flex gap-3">
        <input value={name} onChange={e => setName(e.target.value)} className="input flex-1" placeholder="Tag name" onKeyDown={e => e.key === 'Enter' && addTag()} />
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer" />
        <button onClick={addTag} disabled={saving} className="btn-primary text-sm"><Plus size={15} /> Add</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <div key={tag.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-medium" style={{ backgroundColor: tag.color }}>
            {tag.name}
            <button onClick={() => deleteTag(tag.id)} className="hover:opacity-70 ml-1"><Trash2 size={12} /></button>
          </div>
        ))}
        {tags.length === 0 && <p className="text-sm text-slate-400">No tags yet.</p>}
      </div>
    </div>
  )
}
