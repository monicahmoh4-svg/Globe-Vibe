import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Search, Globe2, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { timeAgo, flag } from '../../utils/helpers'

export default function Chats() {
  const { user } = useAuth()
  const [connections, setConnections] = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')

  useEffect(() => {
    api.get('/users/my/connections')
      .then(r => setConnections(r.data.connections || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = connections.filter(c => {
    const isU = c.user_id === user?.id
    const name = isU ? c.foreigner_name : c.user_name
    return name?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Your Chats</h1>
        <p className="page-sub">{connections.length} connection{connections.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          className="input-field pl-10" placeholder="Search conversations…"/>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i=><div key={i} className="glass rounded-2xl h-18 animate-pulse border border-white/5 h-16"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <MessageCircle size={44} className="text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400 mb-1">No chats yet</p>
          <p className="text-gray-600 text-sm mb-5">Browse foreigners and pay to start a conversation</p>
          <Link to="/browse" className="btn-primary inline-flex text-sm py-2 px-5">Browse People</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(conn => {
            const isU        = conn.user_id === user?.id
            const name       = isU ? conn.foreigner_name  : conn.user_name
            const avatar     = isU ? conn.foreigner_avatar: conn.user_avatar
            const country    = isU ? conn.foreigner_country : conn.user_country
            const countryCode= conn.foreigner_country_code || ''
            const online     = isU && conn.foreigner_online
            const active     = conn.status === 'active'
            const expired    = conn.expires_at && new Date(conn.expires_at) < new Date()
            return (
              <Link key={conn.id} to={active ? `/chat/${conn.id}` : '#'}
                className={`glass flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200
                  ${active ? 'hover:border-primary-500/20 border-white/5 cursor-pointer' : 'border-white/3 opacity-60 cursor-not-allowed'}`}>
                <div className="relative flex-shrink-0">
                  <img src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} className="w-11 h-11 rounded-full"/>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-800 ${online?'bg-green-400 animate-pulse':'bg-gray-600'}`}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-white">{name}</span>
                    {active && !expired && <span className="badge badge-green text-xs">Active</span>}
                    {expired && <span className="badge badge-orange text-xs"><Clock size={10}/>Expired</span>}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span>{flag(countryCode)} {country}</span>
                    <span>·</span>
                    <span>{timeAgo(conn.created_at)}</span>
                    {online && <span className="text-green-400">· Online now</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-600 flex-shrink-0">KES {conn.amount_paid}</div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
