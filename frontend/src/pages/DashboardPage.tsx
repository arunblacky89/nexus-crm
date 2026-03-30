import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList
} from 'recharts'
import { Users, TrendingUp, DollarSign, CalendarCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import api from '../services/api'
import type { DashboardStats } from '../types'
import { formatCurrency, formatDateTime, ACTIVITY_ICONS } from '../utils'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenue, setRevenue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard/'),
      api.get('/reports/revenue-trend/'),
    ]).then(([s, r]) => {
      setStats(s.data)
      setRevenue(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const statCards = [
    {
      label: 'Total Leads',
      value: stats?.total_leads || 0,
      sub: `${stats?.leads_this_month || 0} this month`,
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
      trend: stats && stats.leads_this_month > stats.leads_last_month,
    },
    {
      label: 'Deals Won (Month)',
      value: stats?.deals_won_this_month.count || 0,
      sub: formatCurrency(stats?.deals_won_this_month.value || 0),
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100',
      trend: true,
    },
    {
      label: 'Open Pipeline',
      value: formatCurrency(stats?.open_deals_value || 0),
      sub: `${stats?.total_deals || 0} open deals`,
      icon: DollarSign,
      color: 'text-purple-600 bg-purple-100',
      trend: null,
    },
    {
      label: 'Activities Due Today',
      value: stats?.activities_due_today || 0,
      sub: `${stats?.overdue_activities || 0} overdue`,
      icon: CalendarCheck,
      color: (stats?.overdue_activities || 0) > 0 ? 'text-red-600 bg-red-100' : 'text-amber-600 bg-amber-100',
      trend: false,
    },
  ]

  const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="stat-card">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon size={20} />
                </div>
                {card.trend !== null && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${card.trend ? 'text-green-600' : 'text-red-500'}`}>
                    {card.trend ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {card.trend ? 'Up' : 'Down'}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
                <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Revenue Trend</h3>
          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#grad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No revenue data yet. Close some deals! 🚀
            </div>
          )}
        </div>

        {/* Lead source pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Lead Sources</h3>
          {(stats?.lead_sources?.length || 0) > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={stats!.lead_sources} dataKey="count" nameKey="lead_source" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                    {stats!.lead_sources.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {stats!.lead_sources.slice(0, 4).map((s, i) => (
                  <div key={s.lead_source} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-600">{s.lead_source}</span>
                    </div>
                    <span className="font-medium text-slate-800">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Pipeline funnel */}
      {(stats?.pipeline_by_stage?.length || 0) > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Pipeline by Stage</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats!.pipeline_by_stage.map(stage => (
              <div key={stage.stage} className="text-center">
                <div
                  className="rounded-xl p-3 mb-2"
                  style={{ backgroundColor: stage.color + '20', border: `1px solid ${stage.color}40` }}
                >
                  <p className="text-2xl font-bold" style={{ color: stage.color }}>{stage.count}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(stage.value)}</p>
                </div>
                <p className="text-xs font-medium text-slate-600">{stage.stage}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent activities */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Recent Activities</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {(stats?.recent_activities?.length || 0) === 0 ? (
              <div className="p-5 text-center text-sm text-slate-400">No activities yet</div>
            ) : stats!.recent_activities.slice(0, 6).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-lg">{ACTIVITY_ICONS[a.type] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.assigned_to}</p>
                </div>
                <span className={`text-xs ${a.completed ? 'text-green-600' : 'text-amber-600'}`}>
                  {a.completed ? '✓ Done' : '○ Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top performers */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Top Performers (This Month)</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {(stats?.top_performers?.length || 0) === 0 ? (
              <div className="p-5 text-center text-sm text-slate-400">No won deals this month yet</div>
            ) : stats!.top_performers.map((p, i) => (
              <div key={p.user_id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-400' : 'bg-amber-600'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.deals_won} deals won</p>
                </div>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-32 skeleton" />
      <div className="grid grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="h-10 w-10 skeleton rounded-xl" />
            <div className="h-7 w-20 skeleton" />
            <div className="h-4 w-28 skeleton" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 col-span-2 h-64 skeleton" />
        <div className="card p-5 h-64 skeleton" />
      </div>
    </div>
  )
}
