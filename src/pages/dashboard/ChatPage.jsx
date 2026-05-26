import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, MoreVertical, AlertCircle, Flag, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { formatTime, timeAgo, flag } from '../../utils/helpers'

const POLL_MS = 3000

export default function ChatPage() {
  const { id: connId } = useParams()
  const { user }       = useAuth()
  const [conn, setConn]           = useState(null)
  const [partner, setPartner]     = useState(null)
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState('')
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const lastTs   = useRef(null)
  const bottomRef= useRef(null)
  const pollRef  = useRef(null)

  const scrollBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  // Initial load
  useEffect(() => {
    api.get(`/messages/${connId}`)
      .then(async r => {
        setMessages(r.data.messages || [])
        setConn(r.data.connection)
        if (r.data.messages?.length) {
          lastTs.current = r.data.messages[r.data.messages.length - 1].created_at
        }
        const cn = r.data.connection
        const partnerId = cn?.user_id === user?.id ? cn?.foreigner_id : cn?.user_id
        if (partnerId) {
          const pu = await api.get(`/users/${partnerId}`)
          setPartner(pu.data.user)
        }
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to load chat'))
      .finally(() => setLoading(false))
  }, [connId, user?.id])

  // Polling for new messages
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const params = lastTs.current ? { since: lastTs.current } : {}
        const { data } = await api.get(`/messages/${connId}`, { params })
        if (data.messages?.length > 0) {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id))
            const newMsgs = data.messages.filter(m => !ids.has(m.id))
            if (!newMsgs.length) return prev
            lastTs.current = newMsgs[newMsgs.length - 1].created_at
            return [...prev, ...newMsgs]
          })
        }
      } catch {}
    }, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [connId])

  useEffect(() => { scrollBottom() }, [messages])

  const send = async () => {
    if (!input.trim() || sending) return
    const content = input.trim()
    setInput(''); setSending(true)
    try {
      const { data } = await api.post(`/messages/${connId}`, { content })
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id))
        return ids.has(data.message.id) ? prev : [...prev, data.message]
      })
      lastTs.current = data.message.created_at
    } catch(e) { setError(e.response?.data?.error || 'Failed to send'); setInput(content) }
    finally { setSending(false) }
  }

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  const submitReport = async () => {
    if (!reportReason) return
    try {
      await api.post(`/users/report/${partner?.id}`, { reason: reportReason })
      setShowReport(false)
      alert('Report submitted. Our team will review it.')
    } catch {}
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-7 h-7 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"/>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <AlertCircle size={36} className="text-red-400"/>
      <p className="text-gray-400">{error}</p>
      <Link to="/chats" className="btn-primary text-sm py-2 px-4">Back to Chats</Link>
    </div>
  )

  const isExpired = conn?.expires_at && new Date(conn.expires_at) < new Date()

  // Group by date
  const grouped = messages.reduce((acc, msg) => {
    const day = new Date(msg.created_at).toDateString()
    if (!acc[day]) acc[day] = []
    acc[day].push(msg)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="glass-strong border-b border-white/5 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link to="/chats" className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5">
          <ArrowLeft size={19}/>
        </Link>
        {partner && (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <img src={partner.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.name}`}
                className="w-9 h-9 rounded-full"/>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-800 ${partner.is_online?'bg-green-400 animate-pulse':'bg-gray-600'}`}/>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white flex items-center gap-1.5 truncate">
                {partner.name}
                {partner.is_verified && <span className="text-primary-400 text-xs">✓</span>}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {flag(partner.country_code)} {partner.country}
                {partner.is_online
                  ? <span className="text-green-400 ml-1.5">· Online</span>
                  : <span className="ml-1.5">· {timeAgo(partner.last_seen)}</span>}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isExpired && <span className="badge badge-orange text-xs">Expired</span>}
          <button onClick={()=>setShowReport(true)} className="btn-ghost p-2 text-gray-400">
            <MoreVertical size={16}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
        {Object.entries(grouped).map(([day, dayMsgs]) => (
          <div key={day}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/5"/>
              <span className="text-xs text-gray-600 px-2">{day === new Date().toDateString() ? 'Today' : day}</span>
              <div className="flex-1 h-px bg-white/5"/>
            </div>
            {dayMsgs.map((msg, idx) => {
              const mine    = msg.sender_id === user?.id
              const prev    = idx > 0 ? dayMsgs[idx-1] : null
              const showAva = !mine && (!prev || prev.sender_id !== msg.sender_id)
              return (
                <div key={msg.id} className={`flex items-end gap-2 mb-1 ${mine?'justify-end':'justify-start'}`}>
                  {!mine && (
                    <div className="w-6 flex-shrink-0">
                      {showAva && <img src={partner?.avatar} className="w-6 h-6 rounded-full"/>}
                    </div>
                  )}
                  <div className={`flex flex-col ${mine?'items-end':'items-start'}`}>
                    <div className={mine ? 'msg-sent' : 'msg-recv'}>{msg.content}</div>
                    <span className="text-xs text-gray-600 mt-0.5 px-1">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-gray-400 text-sm">Say hello to {partner?.name?.split(' ')[0]}!</p>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="glass-strong border-t border-white/5 p-3 flex-shrink-0">
        {isExpired ? (
          <div className="text-center py-2">
            <p className="text-gray-500 text-sm mb-2">This chat connection has expired.</p>
            <Link to="/browse" className="btn-primary text-sm inline-flex py-2 px-4">Connect Again</Link>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
              className="input-field flex-1 resize-none min-h-[44px] max-h-28 py-2.5 text-sm no-scrollbar"
              placeholder="Type a message… (Enter to send)" rows={1}/>
            <button onClick={send} disabled={!input.trim() || sending}
              className="btn-primary px-4 py-2.5 rounded-xl flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              <Send size={15}/>
            </button>
          </div>
        )}
      </div>

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={()=>setShowReport(false)}/>
          <div className="relative glass-strong rounded-2xl p-5 w-full max-w-xs border border-white/10 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-white flex items-center gap-2"><Flag size={15} className="text-red-400"/>Report User</h3>
              <button onClick={()=>setShowReport(false)} className="text-gray-400 hover:text-white"><X size={16}/></button>
            </div>
            <select value={reportReason} onChange={e=>setReportReason(e.target.value)} className="input-field mb-4 text-sm">
              <option value="">Select a reason</option>
              <option value="harassment">Harassment</option>
              <option value="spam">Spam</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="fake_profile">Fake profile</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-2">
              <button onClick={()=>setShowReport(false)} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
              <button onClick={submitReport} disabled={!reportReason}
                className="flex-1 text-sm py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
