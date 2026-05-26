import { useState, useEffect } from 'react'
import { Users, MessageCircle, DollarSign, TrendingUp, AlertTriangle, Download, Ban, Star } from 'lucide-react'
import { adminApi } from '../../context/AdminAuthContext'
import { fmtKES, timeAgo } from '../../utils/helpers'

export default function AdminDashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.get('/admin/stats').then(r=>setData(r.data)).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"/></div>

  const { stats={}, revenueByDay=[], recentTransactions=[] } = data || {}
  const maxRev = Math.max(...revenueByDay.map(d=>d.revenue), 1)

  const cards = [
    {label:'Total Users',          value:stats.totalUsers,        icon:Users,         c:'text-blue-400',   bg:'border-blue-500/20  bg-blue-500/5'},
    {label:'Foreigners',           value:stats.totalForeigners,   icon:Star,          c:'text-purple-400', bg:'border-purple-500/20 bg-purple-500/5'},
    {label:'Online Now',           value:stats.onlineUsers,       icon:TrendingUp,    c:'text-green-400',  bg:'border-green-500/20 bg-green-500/5'},
    {label:'Total Revenue',        value:fmtKES(stats.totalRevenue||0), icon:DollarSign,c:'text-yellow-400',bg:'border-yellow-500/20 bg-yellow-500/5'},
    {label:'Total Connections',    value:stats.totalConnections,  icon:MessageCircle, c:'text-primary-400',bg:'border-primary-500/20 bg-primary-500/5'},
    {label:'Pending Withdrawals',  value:`${stats.pendingWithdrawals||0} (${fmtKES(stats.pendingWithdrawalAmount||0)})`,icon:Download,c:'text-orange-400',bg:'border-orange-500/20 bg-orange-500/5'},
    {label:'Banned Users',         value:stats.bannedUsers,       icon:Ban,           c:'text-red-400',    bg:'border-red-500/20 bg-red-500/5'},
    {label:'Open Reports',         value:stats.pendingReports,    icon:AlertTriangle, c:'text-red-400',    bg:'border-red-500/20 bg-red-500/5'},
  ]

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-sub">Platform performance at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((s,i)=>(
          <div key={i} className={`border rounded-2xl p-4 ${s.bg}`}>
            <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center mb-3"><s.icon size={15} className={s.c}/></div>
            <div className="text-lg font-display font-bold text-white">{s.value ?? '—'}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue chart */}
        <div className="bg-dark-800/50 border border-white/5 rounded-2xl p-5">
          <h2 className="font-display font-semibold text-white mb-5 text-sm">Revenue — Last 7 Days</h2>
          {revenueByDay.length === 0
            ? <div className="h-36 flex items-center justify-center text-gray-600 text-sm">No data yet</div>
            : <div className="flex items-end gap-2 h-36">
                {revenueByDay.map((d,i)=>(
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs text-gray-600 font-mono">{Math.round(d.revenue)}</div>
                    <div className="w-full bg-red-500/80 rounded-t-lg hover:bg-red-400 transition-colors"
                      style={{height:`${(d.revenue/maxRev)*100}%`, minHeight:'4px'}}/>
                    <div className="text-xs text-gray-600 truncate w-full text-center">
                      {new Date(d.day).toLocaleDateString('en',{weekday:'short'})}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Recent transactions */}
        <div className="bg-dark-800/50 border border-white/5 rounded-2xl p-5">
          <h2 className="font-display font-semibold text-white mb-4 text-sm">Recent Transactions</h2>
          <div className="space-y-2">
            {recentTransactions.length === 0 && <div className="text-center py-6 text-gray-600 text-sm">No transactions yet</div>}
            {recentTransactions.map(tx=>(
              <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-white/3 last:border-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0
                  ${tx.status==='completed'?'bg-green-500/20 text-green-400':tx.status==='failed'?'bg-red-500/20 text-red-400':'bg-yellow-500/20 text-yellow-400'}`}>
                  {tx.status==='completed'?'✓':tx.status==='failed'?'✗':'…'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white font-medium truncate">{tx.user_name}</div>
                  <div className="text-xs text-gray-600">{timeAgo(tx.created_at)}</div>
                </div>
                <div className={`text-sm font-semibold font-mono ${tx.status==='completed'?'text-green-400':'text-gray-500'}`}>
                  KES {Number(tx.amount).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
