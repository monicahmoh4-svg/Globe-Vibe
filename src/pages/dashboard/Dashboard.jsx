import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, MessageCircle, Wallet, TrendingUp, ArrowRight, Globe2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { fmtKES, timeAgo, flag } from '../../utils/helpers'

export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const [connections, setConnections]   = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/users/my/connections').then(r => setConnections(r.data.connections || [])),
      api.get('/users/my/transactions').then(r => setTransactions(r.data.transactions || [])),
    ]).finally(() => setLoading(false))
    refreshUser()
  }, [])

  const spent  = transactions.filter(t => t.type === 'connection_payment' && t.status === 'completed').reduce((s,t) => s + parseFloat(t.amount), 0)
  const earned = transactions.filter(t => t.type === 'earning'            && t.status === 'completed').reduce((s,t) => s + parseFloat(t.amount), 0)

  const stats = [
    { label: 'Active Chats',   value: connections.filter(c => c.status === 'active').length, icon: MessageCircle, c: 'text-primary-400', bg: 'bg-primary-500/10' },
    { label: user?.is_foreigner ? 'Total Earned' : 'Total Spent', value: fmtKES(user?.is_foreigner ? earned : spent), icon: Wallet, c: 'text-accent-400', bg: 'bg-accent-500/10' },
    { label: 'Connections',    value: user?.total_chats || 0, icon: Users,  c: 'text-blue-400',  bg: 'bg-blue-500/10'  },
    { label: 'Wallet Balance', value: fmtKES(user?.balance || 0), icon: TrendingUp, c: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  return (
    <div className="p-5 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-7">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="font-display text-2xl font-bold text-white">Hey, {user?.name?.split(' ')[0]} 👋</h1>
          {user?.is_foreigner && <span className="badge badge-purple">Foreigner</span>}
          {user?.is_verified  && <span className="badge badge-green">✓ Verified</span>}
        </div>
        <p className="text-gray-400 text-sm">
          {user?.is_foreigner ? 'People are connecting with you. Keep chatting and earning!' : 'Discover and connect with amazing people from around the world.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {stats.map((s,i) => (
          <div key={i} className="glass rounded-2xl p-4 border border-white/5">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}><s.icon size={17} className={s.c} /></div>
            <div className="text-lg font-display font-bold text-white">{loading ? '—' : s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent connections */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-white text-sm">Recent Connections</h2>
            <Link to="/chats" className="text-primary-400 text-xs hover:text-primary-300 flex items-center gap-1">All chats <ArrowRight size={13}/></Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="glass rounded-2xl h-16 animate-pulse border border-white/5"/>)}</div>
          ) : connections.length === 0 ? (
            <div className="card border border-white/5 text-center py-12">
              <Globe2 size={36} className="text-gray-600 mx-auto mb-3"/>
              <p className="text-gray-400 text-sm mb-4">No connections yet</p>
              <Link to="/browse" className="btn-primary text-sm inline-flex py-2 px-4">Browse People <ArrowRight size={14}/></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.slice(0,5).map(conn => {
                const isUser       = conn.user_id === user?.id
                const partnerName  = isUser ? conn.foreigner_name  : conn.user_name
                const partnerAva   = isUser ? conn.foreigner_avatar : conn.user_avatar
                const partnerCnt   = isUser ? conn.foreigner_country : conn.user_country
                const online       = isUser && conn.foreigner_online
                return (
                  <Link key={conn.id} to={`/chat/${conn.id}`}
                    className="glass flex items-center gap-3 p-3.5 rounded-2xl hover:border-primary-500/20 border border-white/5 transition-all">
                    <div className="relative flex-shrink-0">
                      <img src={partnerAva || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerName}`} className="w-10 h-10 rounded-full"/>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-800 ${online?'bg-green-400':'bg-gray-600'}`}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{partnerName}</div>
                      <div className="text-xs text-gray-500">{partnerCnt} · {timeAgo(conn.created_at)}</div>
                    </div>
                    <span className={`badge text-xs ${conn.status==='active'?'badge-green':'badge-orange'}`}>{conn.status==='active'?'Active':'Expired'}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div>
            <h2 className="font-display font-semibold text-white text-sm mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                {to:'/browse', icon:Users,  title:'Browse Foreigners', sub:'Find someone to chat with',       c:'text-primary-400', bg:'bg-primary-500/10'},
                {to:'/wallet', icon:Wallet, title:'My Wallet',         sub:fmtKES(user?.balance||0)+' available', c:'text-accent-400',  bg:'bg-accent-500/10'},
              ].map(a=>(
                <Link key={a.to} to={a.to} className="glass flex items-center gap-3 p-3.5 rounded-2xl hover:border-primary-500/20 border border-white/5 transition-all group">
                  <div className={`w-8 h-8 ${a.bg} rounded-xl flex items-center justify-center flex-shrink-0`}><a.icon size={15} className={a.c}/></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{a.title}</div>
                    <div className="text-xs text-gray-500">{a.sub}</div>
                  </div>
                  <ArrowRight size={13} className="text-gray-600 group-hover:text-primary-400 transition-colors"/>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display font-semibold text-white text-sm mb-3">Recent Transactions</h2>
            <div className="space-y-1.5">
              {transactions.slice(0,5).map(tx=>(
                <div key={tx.id} className="flex items-center gap-2.5 p-2.5 glass rounded-xl border border-white/5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${tx.type==='earning'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400'}`}>
                    {tx.type==='earning'?'+':'-'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate capitalize">{(tx.description||tx.type).replace(/_/g,' ')}</div>
                    <div className="text-xs text-gray-600">{timeAgo(tx.created_at)}</div>
                  </div>
                  <div className={`text-xs font-semibold ${tx.type==='earning'?'text-green-400':'text-red-400'}`}>
                    {tx.type==='earning'?'+':'-'}{fmtKES(tx.amount)}
                  </div>
                </div>
              ))}
              {transactions.length===0 && <div className="text-center py-4 text-gray-600 text-xs">No transactions yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
