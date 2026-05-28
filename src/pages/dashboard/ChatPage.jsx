import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, MoreVertical, AlertCircle, Flag, X, TrendingUp, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { formatTime, timeAgo, flag, fmtKES } from '../../utils/helpers'

const POLL_MS = 3000

// ── Earning toast shown on each message sent ──────────────────────────────────
function EarnToast({ amount, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2000); return () => clearTimeout(t) }, [])
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 backdrop-blur-md rounded-full px-4 py-2 shadow-xl">
        <TrendingUp size={14} className="text-green-400"/>
        <span className="text-green-400 text-sm font-semibold">+{fmtKES(amount)} earned!</span>
      </div>
    </div>
  )
}

// ── Session earning bar ────────────────────────────────────────────────────────
function SessionBar({ connId, userId, isPayer }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!isPayer) return
    const load = () => api.get(`/messages/${connId}/stats`).then(r => setStats(r.data)).catch(()=>{})
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [connId, isPayer])

  if (!isPayer || !stats) return null

  const pct = Math.min(100, (stats.session_earned / stats.max_earn_per_session) * 100)

  return (
    <div className="glass-strong border-b border-white/5 px-4 py-2 flex items-center gap-3">
      <Zap size={13} className="text-yellow-400 flex-shrink-0"/>
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-400">Session earnings</span>
          <span className="text-green-400 font-semibold">{fmtKES(stats.session_earned)} / {fmtKES(stats.max_earn_per_session)}</span>
        </div>
        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}/>
        </div>
      </div>
      <span className="text-xs text-gray-500 flex-shrink-0">{stats.msg_count} msgs</span>
    </div>
  )
}

export default function ChatPage() {
  const { id: connId } = useParams()
  const { user, refreshUser } = useAuth()
  const [conn,    setConn]    = useState(null)
  const [partner, setPartner] = useState(null)
  const [messages,setMessages]= useState([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState('')
  const [toast,   setToast]   = useState(null)      // { amount }
  const [showReport, setShowReport]   = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [isPayer, setIsPayer] = useState(false)

  const lastTs   = useRef(null)
  const bottomRef= useRef(null)
  const pollRef  = useRef(null)
  const earnRate = useRef(3)   // KES per message (updated from API)

  const scrollBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  // Initial load
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
          const pu = await api.get(`/users/${partnerId}`)
          setPartner(pu.data.user)
        }

        // Fetch earning rate
        if (amIPayer) {
          api.get(`/messages/${connId}/stats`)
            .then(r => { if (r.data.earn_per_message) earnRate.current = r.data.earn_per_message })
            .catch(() => {})
        }
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to load chat'))
      .finally(() => setLoading(false))
  }, [connId, user?.id])

  // Polling for new messages every 3 seconds
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
      // Add message to list
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id))
        return ids.has(data.message.id) ? prev : [...prev, data.message]
      })
      lastTs.current = data.message.created_at

      // Show earning toast if user earned on this message
      if (data.is_earning && data.earned > 0) {
        setToast({ amount: data.earned })
        refreshUser()  // refresh wallet balance in context
      }
    } catch(e) {
      setError(e.response?.data?.error || 'Failed to send')
      setInput(content)
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

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
      <AlertCircle size={36} className="text-red-400"/>
      <p className="text-gray-400 text-center">{error}</p>
      <Link to="/chats" className="btn-primary text-sm py-2 px-4">Back to Chats</Link>
    </div>
  )

  const isExpired = conn?.expires_at && new Date(conn.expires_at) < new Date()

  // Group messages by date
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
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-800
                ${partner.is_online ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}/>
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
          {isPayer && !isExpired && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full mr-1">
              <TrendingUp size={11} className="text-green-400"/>
              <span className="text-green-400 text-xs font-medium">+{fmtKES(earnRate.current)}/msg</span>
            </div>
          )}
          {isExpired && <span className="badge badge-orange text-xs">Expired</span>}
          <button onClick={() => setShowReport(true)} className="btn-ghost p-2 text-gray-400">
            <MoreVertical size={16}/>
          </button>
        </div>
      </div>

      {/* Session earning progress bar (only for paying user) */}
      <SessionBar connId={connId} userId={user?.id} isPayer={isPayer}/>

      {/* Earning reminder banner */}
      {isPayer && !isExpired && messages.length === 0 && (
        <div className="mx-4 mt-4 flex items-center gap-3 p-3.5 bg-primary-500/10 border border-primary-500/20 rounded-2xl">
          <div className="w-8 h-8 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-primary-400"/>
          </div>
          <div>
            <div className="text-sm font-medium text-white">You earn {fmtKES(earnRate.current)} per message!</div>
            <div className="text-xs text-gray-400">Start chatting with {partner?.name?.split(' ')[0]} and watch your wallet grow.</div>
          </div>
        </div>
      )}

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
              const prev    = idx > 0 ? dayMsgs[idx - 1] : null
              const showAva = !mine && (!prev || prev.sender_id !== msg.sender_id)
              const earned  = parseFloat(msg.earned_amount || 0)
              return (
                <div key={msg.id} className={`flex items-end gap-2 mb-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                  {!mine && (
                    <div className="w-6 flex-shrink-0">
                      {showAva && (
                        <img src={partner?.avatar} className="w-6 h-6 rounded-full"/>
                      )}
                    </div>
                  )}
                  <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div className={mine ? 'msg-sent' : 'msg-recv'}>{msg.content}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 px-1">
                      <span className="text-xs text-gray-600">{formatTime(msg.created_at)}</span>
                      {mine && earned > 0 && (
                        <span className="text-xs text-green-400 font-medium">+{fmtKES(earned)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-gray-400 text-sm">Say hello to {partner?.name?.split(' ')[0]}!</p>
            {isPayer && (
              <p className="text-primary-400 text-xs mt-1">Every message you send earns you {fmtKES(earnRate.current)}</p>
            )}
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="glass-strong border-t border-white/5 p-3 flex-shrink-0">
        {isExpired ? (
          <div className="text-center py-2">
            <p className="text-gray-500 text-sm mb-2">This chat session has expired.</p>
            <Link to="/browse" className="btn-primary text-sm inline-flex py-2 px-4">Connect Again & Earn</Link>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              className="input-field flex-1 resize-none min-h-[44px] max-h-28 py-2.5 text-sm no-scrollbar"
              placeholder={isPayer ? `Type to earn ${fmtKES(earnRate.current)} per message… (Enter to send)` : "Type a message… (Enter to send)"}
              rows={1}/>
            <button onClick={send} disabled={!input.trim() || sending}
              className="btn-primary px-4 py-2.5 rounded-xl flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {sending
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <Send size={15}/>}
            </button>
          </div>
        )}
      </div>

      {/* Earning toast */}
      {toast && <EarnToast amount={toast.amount} onDone={() => setToast(null)}/>}

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowReport(false)}/>
          <div className="relative glass-strong rounded-2xl p-5 w-full max-w-xs border border-white/10 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
                <Flag size={14} className="text-red-400"/> Report User
              </h3>
              <button onClick={() => setShowReport(false)} className="text-gray-400 hover:text-white">
                <X size={16}/>
              </button>
            </div>
            <select value={reportReason} onChange={e => setReportReason(e.target.value)}
              className="input-field mb-4 text-sm">
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
