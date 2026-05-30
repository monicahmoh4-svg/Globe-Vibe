import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, MoreVertical, AlertCircle, Flag, X, TrendingUp, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { formatTime, timeAgo, flag, fmtKES } from '../../utils/helpers'

const POLL_MS = 3000

function EarnToast({ amount, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2000); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-slide-up">
      <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 backdrop-blur-md rounded-full px-4 py-2 shadow-xl">
        <TrendingUp size={14} className="text-green-400"/>
        <span className="text-green-400 text-sm font-semibold">+{fmtKES(amount)} earned!</span>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { id: connId }  = useParams()
  const { user, refreshUser } = useAuth()
  const [conn,     setConn]     = useState(null)
  const [partner,  setPartner]  = useState(null)
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [sending,  setSending]  = useState(false)
  const [error,    setError]    = useState('')
  const [toast,    setToast]    = useState(null)
  const [stats,    setStats]    = useState({ session_earned: 0, msg_count: 0, earn_per_message: 3 })
  const [showReport,   setShowReport]   = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [isPayer,  setIsPayer]  = useState(false)
  const lastTs    = useRef(null)
  const bottomRef = useRef(null)
  const pollRef   = useRef(null)

  const scrollBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  // Load initial messages
  useEffect(() => {
    api.get(`/messages/${connId}`)
      .then(async r => {
        const msgs = r.data.messages || []
        setMessages(msgs)
        setConn(r.data.connection)
        if (msgs.length) lastTs.current = msgs[msgs.length - 1].created_at

        const cn = r.data.connection
        const amIPayer = cn?.user_id === user?.id
        setIsPayer(amIPayer)

        const partnerId = amIPayer ? cn?.foreigner_id : cn?.user_id
        if (partnerId) {
          const { data } = await api.get(`/users/${partnerId}`)
          setPartner(data.user)
        }

        if (amIPayer) {
          api.get(`/messages/${connId}/stats`)
            .then(r => setStats(r.data))
            .catch(() => {})
        }
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to load chat'))
      .finally(() => setLoading(false))
  }, [connId, user?.id])

  // Poll for new messages
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
    setInput('')
    setSending(true)
    try {
      const { data } = await api.post(`/messages/${connId}`, { content })
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id))
        return ids.has(data.message.id) ? prev : [...prev, data.message]
      })
      lastTs.current = data.message.created_at

      if (data.is_earning && data.earned > 0) {
        setToast({ amount: data.earned })
        setStats(s => ({ ...s, session_earned: (parseFloat(s.session_earned) + data.earned), msg_count: s.msg_count + 1 }))
        refreshUser()
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to send message')
      setInput(content)
      setTimeout(() => setError(''), 4000)
    } finally {
      setSending(false)
    }
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

  if (error && !conn) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
      <AlertCircle size={36} className="text-red-400"/>
      <p className="text-gray-400 text-center">{error}</p>
      <Link to="/chats" className="btn-primary text-sm py-2 px-4">Back to Chats</Link>
    </div>
  )

  const isExpired = conn?.status !== 'active' || (conn?.expires_at && new Date(conn.expires_at) < new Date())
  const maxEarn   = parseFloat(stats.max_earn_per_session || 500)
  const earned    = parseFloat(stats.session_earned || 0)
  const pct       = Math.min(100, (earned / maxEarn) * 100)

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
              <img src={partner.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.name}`} className="w-9 h-9 rounded-full"/>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-800 ${partner.is_online ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}/>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white flex items-center gap-1.5 truncate">
                {partner.name} {partner.is_verified && <span className="text-primary-400 text-xs">✓</span>}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {flag(partner.country_code)} {partner.country}
                {partner.is_online ? <span className="text-green-400 ml-1.5">· Online</span> : <span className="ml-1.5">· {timeAgo(partner.last_seen)}</span>}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isPayer && !isExpired && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <TrendingUp size={11} className="text-green-400"/>
              <span className="text-green-400 text-xs font-medium">+{fmtKES(stats.earn_per_message || 3)}/msg</span>
            </div>
          )}
          {isExpired && <span className="badge badge-orange text-xs">Expired</span>}
          <button onClick={() => setShowReport(true)} className="btn-ghost p-2 text-gray-400">
            <MoreVertical size={16}/>
          </button>
        </div>
      </div>

      {/* Session earning bar */}
      {isPayer && !isExpired && (
        <div className="glass-strong border-b border-white/5 px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <Zap size={13} className="text-yellow-400 flex-shrink-0"/>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">Session earnings</span>
              <span className="text-green-400 font-semibold">{fmtKES(earned)} / {fmtKES(maxEarn)}</span>
            </div>
            <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-primary-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}/>
            </div>
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0">{stats.msg_count || 0} msgs</span>
        </div>
      )}

      {/* Send error banner */}
      {error && conn && (
        <div className="mx-4 mt-3 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle size={14}/> {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-gray-400 text-sm">Say hello to {partner?.name?.split(' ')[0]}!</p>
            {isPayer && <p className="text-primary-400 text-xs mt-1">Every message earns you {fmtKES(stats.earn_per_message || 3)}</p>}
          </div>
        )}

        {Object.entries(grouped).map(([day, dayMsgs]) => (
          <div key={day}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/5"/>
              <span className="text-xs text-gray-600 px-2">{day === new Date().toDateString() ? 'Today' : day}</span>
              <div className="flex-1 h-px bg-white/5"/>
            </div>
            {dayMsgs.map((msg, idx) => {
              const mine    = msg.sender_id === user?.id
              const prev    = idx > 0 ? dayMsgs[idx - 1] : null
              const showAva = !mine && (!prev || prev.sender_id !== msg.sender_id)
              const msgEarned = parseFloat(msg.earned_amount || 0)
              return (
                <div key={msg.id} className={`flex items-end gap-2 mb-1.5 ${mine ? 'justify-end' : 'justify-start'}`}>
                  {!mine && (
                    <div className="w-6 flex-shrink-0">
                      {showAva && <img src={partner?.avatar} className="w-6 h-6 rounded-full"/>}
                    </div>
                  )}
                  <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div className={mine ? 'msg-sent' : 'msg-recv'}>{msg.content}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 px-1">
                      <span className="text-xs text-gray-600">{formatTime(msg.created_at)}</span>
                      {mine && msgEarned > 0 && (
                        <span className="text-xs text-green-400 font-medium">+{fmtKES(msgEarned)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="glass-strong border-t border-white/5 p-3 flex-shrink-0">
        {isExpired ? (
          <div className="text-center py-2">
            <p className="text-gray-500 text-sm mb-2">This chat session has expired.</p>
            <Link to="/browse" className="btn-primary text-sm inline-flex py-2 px-4">Chat with Someone New</Link>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              className="input-field flex-1 resize-none min-h-[44px] max-h-28 py-2.5 text-sm no-scrollbar"
              placeholder={isPayer ? `Type to earn ${fmtKES(stats.earn_per_message || 3)}… (Enter to send)` : 'Type a message… (Enter to send)'}
              rows={1}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="btn-primary px-4 py-2.5 rounded-xl flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {sending
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <Send size={15}/>}
            </button>
          </div>
        )}
      </div>

      {toast && <EarnToast amount={toast.amount} onDone={() => setToast(null)}/>}

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowReport(false)}/>
          <div className="relative glass-strong rounded-2xl p-5 w-full max-w-xs border border-white/10 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                <Flag size={14} className="text-red-400"/> Report User
              </h3>
              <button onClick={() => setShowReport(false)} className="text-gray-400 hover:text-white"><X size={16}/></button>
            </div>
            <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="input-field mb-4 text-sm">
              <option value="">Select a reason</option>
              <option value="harassment">Harassment</option>
              <option value="spam">Spam</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="fake_profile">Fake profile</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowReport(false)} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
              <button onClick={submitReport} disabled={!reportReason}
                className="flex-1 text-sm py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
