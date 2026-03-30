import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Plus, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import type { Notification } from '../../types'
import { timeAgo } from '../../utils'

interface HeaderProps {
  onToggleSidebar: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>({})
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Ctrl+K to open search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function loadNotifications() {
    try {
      const res = await api.get('/notifications/?page_size=10&ordering=-created_at')
      setNotifications(res.data.results || [])
      const unread = await api.get('/notifications/unread-count/')
      setUnreadCount(unread.data.count)
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.post('/notifications/mark-all-read/')
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {}
  }

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults({}); return }
    const timer = setTimeout(async () => {
      try {
        const [leads, contacts, deals] = await Promise.all([
          api.get(`/leads/?search=${searchQuery}&page_size=3`),
          api.get(`/contacts/?search=${searchQuery}&page_size=3`),
          api.get(`/deals/?search=${searchQuery}&page_size=3`),
        ])
        setSearchResults({
          leads: leads.data.results,
          contacts: contacts.data.results,
          deals: deals.data.results,
        })
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const QUICK_ADD = [
    { label: 'Add Lead', path: '/leads', action: () => navigate('/leads?create=1') },
    { label: 'Add Contact', path: '/contacts', action: () => navigate('/contacts?create=1') },
    { label: 'Add Deal', path: '/deals', action: () => navigate('/deals?create=1') },
    { label: 'Add Activity', path: '/activities', action: () => navigate('/activities?create=1') },
  ]

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 shrink-0">
        <button onClick={onToggleSidebar} className="btn-ghost p-2">
          <Menu size={18} />
        </button>

        {/* Search trigger */}
        <button
          onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
          className="flex-1 max-w-sm flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-400 hover:bg-slate-200 transition-colors text-left"
        >
          <Search size={15} />
          <span className="flex-1">Search... </span>
          <kbd className="text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200 hidden sm:block">⌘K</kbd>
        </button>

        <div className="flex items-center gap-1 ml-auto">
          {/* Quick add */}
          <div className="relative">
            <button
              onClick={() => setQuickAddOpen(!quickAddOpen)}
              className="btn-primary px-3 py-1.5 text-sm"
            >
              <Plus size={15} /> Add
            </button>
            {quickAddOpen && (
              <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-lg shadow-lg w-40 z-50 py-1">
                {QUICK_ADD.map(item => (
                  <button
                    key={item.label}
                    onClick={() => { item.action(); setQuickAddOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setQuickAddOpen(false) }}
              className="btn-ghost p-2 relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-xl shadow-xl w-80 z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="font-semibold text-sm text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400">No notifications</div>
                  ) : notifications.map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${!n.is_read ? 'bg-blue-50/40' : ''}`}>
                      <p className="text-sm font-medium text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-100">
                  <button className="w-full text-center text-xs text-blue-600 py-1 hover:underline">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
            {user?.first_name?.[0] || 'U'}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
              <Search size={16} className="text-slate-400" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search leads, contacts, deals..."
                className="flex-1 text-sm outline-none text-slate-800 placeholder-slate-400"
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery('') }}>
                <X size={16} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {!searchQuery && (
                <p className="text-center text-sm text-slate-400 py-8">Type to search across all records</p>
              )}
              {searchResults.leads?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase px-2 mb-1">Leads</p>
                  {searchResults.leads.map((l: any) => (
                    <button key={l.id} onClick={() => { navigate(`/leads/${l.uuid}`); setSearchOpen(false) }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                        {l.first_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{l.full_name}</p>
                        <p className="text-xs text-slate-400">{l.company_name || l.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.contacts?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase px-2 mb-1">Contacts</p>
                  {searchResults.contacts.map((c: any) => (
                    <button key={c.id} onClick={() => { navigate(`/contacts/${c.uuid}`); setSearchOpen(false) }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
                      <div className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-semibold">
                        {c.first_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.full_name}</p>
                        <p className="text-xs text-slate-400">{c.company_detail?.name || c.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.deals?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase px-2 mb-1">Deals</p>
                  {searchResults.deals.map((d: any) => (
                    <button key={d.id} onClick={() => { navigate(`/deals/${d.uuid}`); setSearchOpen(false) }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">
                        ₹
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{d.title}</p>
                        <p className="text-xs text-slate-400">{d.stage_name} · {d.contact_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
