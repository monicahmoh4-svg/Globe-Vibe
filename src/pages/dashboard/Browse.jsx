import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Star, MessageCircle, Globe2, Phone, X, CheckCircle, Loader, AlertCircle, Zap, TrendingUp, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { flag, fmtKES } from '../../utils/helpers'

// ── One-time Activation Modal ─────────────────────────────────────────────────
function ActivationModal({ fee, earnPerMsg, onClose, onActivated }) {
  const [phone, setPhone] = useState('')
  const [step,  setStep]  = useState('confirm')
  const [msg,   setMsg]   = useState('')
  const [txId,  setTxId]  = useState('')
  const { refreshUser }   = useAuth()

  const initiate = async () => {
    if (phone.replace(/\D/g, '').length < 9) { setMsg('Enter a valid M-Pesa phone number'); return }
    setStep('paying'); setMsg('')
    try {
      const { data } = await api.post('/payments/activate', { phone })
      if (data.already_activated) { await refreshUser(); onActivated(); return }
      setTxId(data.transaction_id)
      if (data.demo) {
        setStep('polling'); setMsg('Demo mode — confirming payment…')
        setTimeout(async () => {
          try {
            await api.post(`/payments/demo-activate/${data.transaction_id}`)
            await refreshUser()
            setStep('success')
          } catch { setStep('error'); setMsg('Demo confirmation failed') }
        }, 2000)
      } else {
        setStep('polling')
        setMsg(`STK Push sent to ${phone}. Enter your M-Pesa PIN.`)
        poll(data.transaction_id)
      }
    } catch (e) { setStep('error'); setMsg(e.response?.data?.error || 'Payment failed. Please try again.') }
  }

  const poll = useCallback(txId => {
    let attempts = 0
    const check = async () => {
      if (attempts > 30) { setStep('error'); setMsg('Payment timed out. Please try again.'); return }
      attempts++
      try {
        const { data } = await api.get(`/payments/status/${txId}`)
        if (data.activated) { await refreshUser(); setStep('success'); return }
        if (data.transaction?.status === 'failed') { setStep('error'); setMsg('Payment declined or cancelled.'); return }
      } catch {}
      setTimeout(check, 3000)
    }
    setTimeout(check, 3000)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={step !== 'polling' && step !== 'paying' ? onClose : undefined}/>
      <div className="relative glass-strong rounded-3xl p-6 w-full max-w-sm border border-white/10 animate-slide-up">
        {step !== 'polling' && step !== 'paying' &&
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18}/></button>}

        {step === 'confirm' && <>
          <div className="w-12 h-12 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-4">
            <Zap size={22} className="text-primary-400"/>
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-1">Activate Your Account</h3>
          <p className="text-gray-400 text-sm mb-5">Pay once to unlock chats with ALL foreigners forever. Earn {fmtKES(earnPerMsg)} per message you send!</p>

          <div className="space-y-2.5 bg-dark-700/60 rounded-2xl p-4 mb-5 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">One-time activation fee</span><span className="text-orange-400 font-semibold">{fmtKES(fee)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Earn per message sent</span><span className="text-green-400 font-semibold">+{fmtKES(earnPerMsg)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Foreigners unlocked</span><span className="text-white font-semibold">All (unlimited)</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Activation expires</span><span className="text-white font-semibold">Never</span></div>
            <div className="border-t border-white/10 pt-2.5 flex justify-between">
              <span className="text-gray-400">Break even after</span>
              <span className="text-primary-400 font-semibold">~{Math.ceil(fee / earnPerMsg)} messages</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-1.5 block">M-Pesa Phone Number</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="input-field pl-10" placeholder="07XX XXX XXX"/>
            </div>
          </div>
          {msg && <p className="text-red-400 text-sm mb-3">{msg}</p>}
          <button onClick={initiate} className="btn-primary w-full py-3">
            <Zap size={16}/> Pay {fmtKES(fee)} &amp; Unlock All Chats
          </button>
        </>}

        {step === 'paying' && <div className="text-center py-8">
          <div className="w-14 h-14 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"/>
          <p className="text-white font-display font-semibold mb-1">Initiating Payment…</p>
          <p className="text-gray-400 text-sm">Sending STK Push to your phone</p>
        </div>}

        {step === 'polling' && <div className="text-center py-8">
          <div className="w-14 h-14 bg-primary-500/10 border-2 border-primary-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Phone size={24} className="text-primary-400"/>
          </div>
          <p className="text-white font-display font-semibold mb-1">Check Your Phone!</p>
          <p className="text-gray-400 text-sm mb-3">{msg}</p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <Loader size={12} className="animate-spin"/> Waiting for confirmation…
          </div>
        </div>}

        {step === 'success' && <div className="text-center py-6">
          <div className="w-14 h-14 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-400"/>
          </div>
          <p className="text-white font-display text-xl font-bold mb-1">Account Activated! 🎉</p>
          <p className="text-gray-400 text-sm mb-2">All foreigners are now unlocked. Start chatting and earn <span className="text-green-400 font-semibold">{fmtKES(earnPerMsg)} per message!</span></p>
          <button onClick={onActivated} className="btn-primary w-full py-3 mt-4">
            <MessageCircle size={17}/> Browse &amp; Start Chatting
          </button>
        </div>}

        {step === 'error' && <div className="text-center py-6">
          <div className="w-14 h-14 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-400"/>
          </div>
          <p className="text-white font-display text-xl font-bold mb-1">Payment Failed</p>
          <p className="text-gray-400 text-sm mb-5">{msg}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
            <button onClick={() => { setStep('confirm'); setMsg('') }} className="btn-primary flex-1 text-sm py-2.5">Try Again</button>
          </div>
        </div>}
      </div>
    </div>
  )
}

// ── Start Chat Modal (for activated users) ────────────────────────────────────
function StartChatModal({ foreigner, earnPerMsg, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const nav = useNavigate()

  const start = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/chats/start', { foreigner_id: foreigner.id })
      nav(`/chat/${data.connection_id}`)
    } catch (e) { setError(e.response?.data?.error || 'Failed to start chat'); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative glass-strong rounded-3xl p-6 w-full max-w-sm border border-white/10 animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18}/></button>

        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
          <img src={foreigner.avatar} className="w-12 h-12 rounded-2xl bg-dark-600"/>
          <div>
            <div className="text-white font-semibold font-display">{foreigner.name}</div>
            <div className="text-gray-400 text-sm">{flag(foreigner.country_code)} {foreigner.country}</div>
            <div className="flex items-center gap-1 text-xs text-yellow-400 mt-0.5">
              <Star size={10} className="fill-yellow-400"/> {Number(foreigner.rating).toFixed(1)} · {foreigner.total_chats} chats
            </div>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3.5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-green-400"/>
            <span className="text-green-400 text-sm font-semibold">You earn {fmtKES(earnPerMsg)} per message!</span>
          </div>
          <p className="text-xs text-gray-400">Every message you send to {foreigner.name.split(' ')[0]} earns you money. Chat is free — your account is already activated.</p>
        </div>

        <p className="text-sm text-gray-400 mb-5">
          <span className="text-white font-medium">{foreigner.name.split(' ')[0]}</span> wants to learn Kiswahili and connect with people from Africa. Say hello!
        </p>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button onClick={start} disabled={loading} className="btn-primary w-full py-3">
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            : <><MessageCircle size={17}/> Start Chatting &amp; Earning</>}
        </button>
      </div>
    </div>
  )
}

// ── Main Browse Page ───────────────────────────────────────────────────────────
export default function Browse() {
  const { user } = useAuth()
  const [foreigners,  setForeigners]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [page,        setPage]        = useState(1)
  const [total,       setTotal]       = useState(0)
  const [showActivate,setShowActivate]= useState(false)
  const [selected,    setSelected]    = useState(null)
  const [settings,    setSettings]    = useState({ activation_fee: 100, earn_per_message: 3 })

  useEffect(() => {
    api.get('/public/settings')
      .then(r => setSettings(r.data))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users/foreigners', { params: { page, limit: 12, search } })
      setForeigners(data.foreigners || [])
      setTotal(data.total || 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  const handleCardClick = (foreigner) => {
    if (!user?.is_activated) { setShowActivate(true) }
    else { setSelected(foreigner) }
  }

  const totalPages = Math.ceil(total / 12)
  const isActivated = user?.is_activated

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Browse Foreigners</h1>
        <p className="page-sub">{total} people ready to chat · Earn {fmtKES(settings.earn_per_message)} per message</p>
      </div>

      {/* Activation banner */}
      {!isActivated ? (
        <div className="glass rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 mb-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lock size={18} className="text-orange-400"/>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white mb-0.5">Activate to chat with all foreigners</div>
            <div className="text-xs text-gray-400">Pay {fmtKES(settings.activation_fee)} once to unlock unlimited chats. Earn {fmtKES(settings.earn_per_message)} per message you send.</div>
          </div>
          <button onClick={() => setShowActivate(true)} className="btn-primary text-xs py-2 px-4 flex-shrink-0">
            <Zap size={13}/> Activate Now
          </button>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-green-500/20 bg-green-500/5 p-3.5 mb-5 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-400 flex-shrink-0"/>
          <div>
            <span className="text-sm font-semibold text-white">Account Activated ✓</span>
            <span className="text-xs text-gray-400 ml-2">Click any foreigner to start chatting and earning {fmtKES(settings.earn_per_message)}/msg</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="input-field pl-10" placeholder="Search by name, country, language…"/>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="glass rounded-2xl h-72 animate-pulse border border-white/5"/>)}
        </div>
      ) : foreigners.length === 0 ? (
        <div className="text-center py-20">
          <Globe2 size={44} className="text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400">No foreigners found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {foreigners.map(f => {
            const interests = (() => { try { return JSON.parse(f.interests || '[]') } catch { return [] } })()
            return (
              <div key={f.id} className="card-hover group" onClick={() => handleCardClick(f)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="relative">
                    <img src={f.avatar} alt={f.name} className="w-[52px] h-[52px] rounded-2xl bg-dark-600"/>
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-dark-800 ${f.is_online ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}/>
                  </div>
                  {f.is_verified && <span className="badge badge-blue text-xs">✓</span>}
                </div>

                <h3 className="font-display font-semibold text-white text-sm mb-0.5">{f.name}</h3>
                <div className="text-xs text-gray-500 mb-2">{flag(f.country_code)} {f.country}</div>

                <div className="flex items-center gap-2.5 text-xs text-gray-500 mb-2.5">
                  <span className="flex items-center gap-1"><Star size={10} className="text-yellow-400 fill-yellow-400"/>{Number(f.rating).toFixed(1)}</span>
                  <span>{f.total_chats} chats</span>
                  <span className={f.is_online ? 'text-green-400' : 'text-gray-600'}>{f.is_online ? '● Online' : '○ Offline'}</span>
                </div>

                <p className="text-xs text-gray-400 mb-3 leading-relaxed line-clamp-2">{f.bio}</p>

                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {interests.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-gray-400">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1 mb-3 text-xs text-green-400">
                  <TrendingUp size={11}/> Earn {fmtKES(settings.earn_per_message)}/msg
                </div>

                {isActivated ? (
                  <button className="btn-primary w-full text-xs py-2.5 rounded-xl">
                    <MessageCircle size={13}/> Start Chat (Free)
                  </button>
                ) : (
                  <button className="w-full text-xs py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all flex items-center justify-center gap-1.5">
                    <Lock size={12}/> Activate to Chat
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Prev</button>
          <span className="text-gray-400 text-sm">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next</button>
        </div>
      )}

      {showActivate && (
        <ActivationModal
          fee={settings.activation_fee}
          earnPerMsg={settings.earn_per_message}
          onClose={() => setShowActivate(false)}
          onActivated={() => { setShowActivate(false); load() }}
        />
      )}

      {selected && (
        <StartChatModal
          foreigner={selected}
          earnPerMsg={settings.earn_per_message}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
