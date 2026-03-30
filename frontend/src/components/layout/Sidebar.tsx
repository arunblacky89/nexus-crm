import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookUser, Building2, TrendingUp,
  CalendarCheck, Mail, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { getInitials } from '../../utils'
import { cn } from '../../utils'
import api from '../../services/api'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/contacts', icon: BookUser, label: 'Contacts' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/deals', icon: TrendingUp, label: 'Deals' },
  { to: '/activities', icon: CalendarCheck, label: 'Activities' },
  { to: '/emails', icon: Mail, label: 'Emails' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await api.post('/auth/logout/', { refresh: refreshToken })
    } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return (
    <aside
      className={cn(
        'bg-sidebar flex flex-col transition-all duration-300 z-30',
        'fixed lg:static inset-y-0 left-0',
        collapsed ? 'w-16' : 'w-60',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-14 flex items-center border-b border-slate-800 shrink-0',
        collapsed ? 'justify-center px-2' : 'gap-3 px-4',
      )}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
          N
        </div>
        {!collapsed && (
          <span className="text-white font-semibold text-sm">NexusCRM</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              cn(
                'sidebar-item',
                isActive && 'active',
                collapsed && 'justify-center px-2',
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className={cn(
        'border-t border-slate-800 p-3',
        collapsed ? 'items-center' : '',
      )}>
        {collapsed ? (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user ? getInitials(user.full_name || user.username) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.full_name || user?.username}</p>
              <p className="text-slate-400 text-xs truncate capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition-colors p-1"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
