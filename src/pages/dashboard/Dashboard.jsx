import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, MessageCircle, Wallet, TrendingUp, ArrowRight, Globe2, Zap, Lock, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { fmtKES, timeAgo, flag } from '../../utils/helpers'

export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const [connections,  setConnections]  = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [settings,     setSettings]     = useState({ activation_fee: 100, earn_per_message: 3 })

  useEffect(() => {
    Promise.all([
      api.get('/users/my/connections').then(r  => setConnections(r.data.connections || [])),
      api.get('/users/my/transactions').then(r => setTransactions(r.data.transactions || [])),
      api.get('/public/settings').then(r => setSettings(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
    refreshUser()
  }, [])

  const chatEarnings = transactions
    .filter(t => t.type === 'chat_earning' && t.status === 'completed')
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const stats = [
    { label: 'Active Chats',   value: connections.filter(c => c.status === 'active').length, icon: MessageCircle, c: 'text-primary-400', bg: 'bg-primary-500/10' },
    { label: 'Chat Earnings',  value: fmtKES(chatEarnings),                                  icon: TrendingUp,    c: 'text-green-400',   bg: 'bg-green-500/10'  },
    { label: 'Total Chats',    value: user?.total_chats || 0,                                icon: Users,         c: 'text-blue-400',    bg: 'bg-blue-500/10'   },
    { label: 'Wallet Balance', value: fmtKES(user?.balance || 0),                            icon: Wallet,        c: 'text-accent-400',  bg: 'bg-accent-500/10' },
  ]

  return (
    <div className="p-5 max-w-5xl mx-auto">

      {/* Welcome */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="font-display text-2xl font-bold text-white">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          {user?.is_foreigner  && <span className="badge badge-purple">Foreigner</span>}
          {user?.is_verified   && <span className="badge badge-green">✓ Verified</span>}
          {user?.is_activated  && <span className="badge badge-blue">✓ Activated</span>}
        </div>
        <p className="text-gray-400 text-sm">
          {user?.is_foreigner
            ? 'You are listed as a foreigner. Users can start chats with you.'
            : user?.is_activated
              ? 'Your account is activated. Start chatting with foreigners and earn money!'
              : 'Activate your account once to unlock all foreigners and start earning.'}
        </p>
      </div>

      {/* Activation CTA — shown when not activated and not a foreigner */}
      {!user?.is_foreigner && !user?.is_activated && (
        <div className="glass-strong rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-11 h-11 bg-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Lock size={20} className="text-orange-400"/>
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold text-white mb-0.5">Activate to unlock all chats</div>
            <div className="text-sm text-gray-400">
              Pay <span className="text-white font-medium">{fmtKES(settings.activation_fee)} once</span> to chat with all foreigners forever.
              Earn <span className="text-green-400 font-medium">{fmtKES(settings.earn_per_message)} per message</span> you send — money goes straight to your wallet.
            </div>
          </div>
          <Link to="/browse" className="btn-primary text-sm py-2.5 px-5 flex-shrink-0">
            <Zap size={14}/> Activate Now
          </Link>
        </div>
      )}

      {/* Activated success banner */}
      {!user?.is_foreigner && user?.is_activated && connections.length === 0 && (
        <div className="glass rounded-2xl border border-green-500/20 bg-green-500/5 p-4 mb-6 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-400 flex-shrink-0"/>
          <div>
            <div className="text-sm font-semibold text-white">Account Activated ✓</div>
            <div className="text-xs text-gray-400">Browse foreigners and start chatting. Earn {fmtKES(settings.earn_per_message)} per message you send!</div>
          </div>
          <Link to="/browse" className="btn-primary text-xs py-2 px-4 flex-shrink-0 ml-auto">Browse Now</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 border border-white/5">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={17} className={s.c}/>
            </div>
            <div className="text-lg font-display font-bold text-white">{loading ? '—' : s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Recent connections */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-white text-sm">Recent Chats</h2>
            <Link to="/chats" className="text-primary-400 text-xs hover:text-primary-300 flex items-center gap-1">
              All chats <ArrowRight size={13}/>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-16 animate-pulse border border-white/5"/>)}
            </div>
          ) : connections.length === 0 ? (
            <div className="card border border-white/5 text-center py-12">
              <Globe2 size={36} className="text-gray-600 mx-auto mb-3"/>
              <p className="text-gray-400 text-sm mb-1">No chats yet</p>
              <p className="text-gray-600 text-xs mb-4">
                {user?.is_activated ? 'Browse foreigners and start chatting' : 'Activate your account to start chatting'}
              </p>
              <Link to="/browse" className="btn-primary text-sm inline-flex py-2 px-4">
                {user?.is_activated ? 'Browse Foreigners' : 'Activate Account'} <ArrowRight size={14}/>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.slice(0, 5).map(conn => {
                const isU        = conn.user_id === user?.id
                const name       = isU ? conn.foreigner_name  : conn.user_name
                const avatar     = isU ? conn.foreigner_avatar : conn.user_avatar
                const country    = isU ? conn.foreigner_country : conn.user_country
                const online     = isU && conn.foreigner_online
                return (
                  <Link key={conn.id} to={`/chat/${conn.id}`}
                    className="glass flex items-center gap-3 p-3.5 rounded-2xl hover:border-primary-500/20 border border-white/5 transition-all">
                    <div className="relative flex-shrink-0">
                      <img src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} className="w-10 h-10 rounded-full"/>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-800 ${online ? 'bg-green-400' : 'bg-gray-600'}`}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{name}</div>
                      <div className="text-xs text-gray-500">{country} · {timeAgo(conn.created_at)}</div>
                    </div>
                    <span className={`badge text-xs ${conn.status === 'active' ? 'badge-green' : 'badge-orange'}`}>
                      {conn.status === 'active' ? 'Active' : 'Expired'}
                    </span>
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
                { to: '/browse', icon: Users, title: user?.is_activated ? 'Browse & Chat' : 'Activate Account', sub: user?.is_activated ? `Earn ${fmtKES(settings.earn_per_message)}/msg` : `Pay ${fmtKES(settings.activation_fee)} once`, c: 'text-primary-400', bg: 'bg-primary-500/10' },
                { to: '/wallet', icon: Wallet, title: 'My Wallet', sub: fmtKES(user?.balance || 0) + ' available', c: 'text-green-400', bg: 'bg-green-500/10' },
              ].map(a => (
                <Link key={a.to} to={a.to}
                  className="glass flex items-center gap-3 p-3.5 rounded-2xl hover:border-primary-500/20 border border-white/5 transition-all group">
                  <div className={`w-8 h-8 ${a.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <a.icon size={15} className={a.c}/>
                  </div>
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
            <h2 className="font-display font-semibold text-white text-sm mb-3">Recent Earnings</h2>
            <div className="space-y-1.5">
              {transactions.filter(t => t.type === 'chat_earning').slice(0, 5).map(tx => (
                <div key={tx.id} className="flex items-center gap-2.5 p-2.5 glass rounded-xl border border-white/5">
                  <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={13} className="text-green-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">Chat Earning</div>
                    <div className="text-xs text-gray-600">{timeAgo(tx.created_at)}</div>
                  </div>
                  <div className="text-xs font-semibold text-green-400">+{fmtKES(tx.amount)}</div>
                </div>
              ))}
              {transactions.filter(t => t.type === 'chat_earning').length === 0 && (
                <div className="text-center py-5 text-gray-600 text-xs">Start chatting to earn money here</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
