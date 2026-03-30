import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '../../services/api'
import { formatCurrency } from '../../utils'

export default function ReportsPage() {
  const [tab, setTab] = useState('sales')
  const [pipeline, setPipeline] = useState<any[]>([])
  const [byUser, setByUser] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [revenue, setRevenue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/reports/pipeline/'),
      api.get('/reports/sales-by-user/'),
      api.get('/reports/activities-summary/'),
      api.get('/reports/revenue-trend/'),
    ]).then(([p, u, a, r]) => {
      setPipeline(p.data?.[0]?.stages || [])
      setByUser(u.data)
      setActivities(a.data)
      setRevenue(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const TABS = [
    { id: 'sales', label: '💰 Sales' },
    { id: 'pipeline', label: '📊 Pipeline' },
    { id: 'activities', label: '📅 Activities' },
    { id: 'users', label: '👥 User Performance' },
  ]

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-4">
      <h1 className="page-title">Reports & Analytics</h1>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="card p-5 h-64 skeleton animate-pulse" />)}
        </div>
      ) : (
        <>
          {tab === 'sales' && (
            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Revenue Trend (Won Deals)</h3>
                {revenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={revenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No revenue data yet</div>}
              </div>
            </div>
          )}

          {tab === 'pipeline' && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Deals by Pipeline Stage</h3>
              {pipeline.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={pipeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="stage_name" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number, name) => name === 'value' ? formatCurrency(v) : v} />
                      <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Deals" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="value" fill="#22c55e" name="Value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr>{['Stage', 'Deals', 'Value', 'Probability'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                      <tbody>{pipeline.map(s => (
                        <tr key={s.stage_name} className="hover:bg-slate-50">
                          <td className="table-cell font-medium">{s.stage_name}</td>
                          <td className="table-cell">{s.count}</td>
                          <td className="table-cell text-green-600 font-medium">{formatCurrency(s.value)}</td>
                          <td className="table-cell">{s.probability}%</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </>
              ) : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No pipeline data</div>}
            </div>
          )}

          {tab === 'activities' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Activities by Type</h3>
                {activities.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={activities} dataKey="total" nameKey="activity_type" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                        {activities.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>}
              </div>
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Completion Rate</h3>
                <div className="space-y-4 mt-4">
                  {activities.map((a, i) => {
                    const pct = a.total > 0 ? Math.round((a.completed / a.total) * 100) : 0
                    return (
                      <div key={a.activity_type}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700 font-medium">{a.activity_type}</span>
                          <span className="text-slate-500">{a.completed}/{a.total} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="card">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700">Sales Performance (This Month)</h3>
              </div>
              {byUser.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">No won deals this month.</div>
              ) : (
                <table className="w-full">
                  <thead><tr>{['Rank', 'Salesperson', 'Deals Won', 'Revenue'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                  <tbody>
                    {byUser.map((u, i) => (
                      <tr key={u.user_id} className="hover:bg-slate-50">
                        <td className="table-cell">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-400' : 'bg-amber-600'}`}>{i + 1}</div>
                        </td>
                        <td className="table-cell font-medium text-slate-800">{u.name}</td>
                        <td className="table-cell"><span className="badge-green">{u.deals_won}</span></td>
                        <td className="table-cell text-green-600 font-semibold">{formatCurrency(u.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
