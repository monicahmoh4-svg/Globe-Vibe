import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, Phone, CheckCircle, Clock, XCircle, X, Zap, MessageCircle, DollarSign, ArrowUpRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { fmtKES, timeAgo } from '../../utils/helpers'

const STATUS = {
  completed: { cls: 'badge-green',  label: 'Completed', icon: CheckCircle },
  pending:   { cls: 'badge-orange', label: 'Pending',   icon: Clock       },
  failed:    { cls: 'badge-red',    label: 'Failed',     icon: XCircle    },
}

const TX_TYPE = {
  chat_earning:   { label: 'Chat Earning',        color: 'text-green-400',  bg: 'bg-green-500/10',  sign: '+' },
  earning:        { label: 'Earning',             color: 'text-green-400',  bg: 'bg-green-500/10',  sign: '+' },
  activation_fee: { label: 'Activation Fee',      color: 'text-orange-400', bg: 'bg-orange-500/10', sign: '−' },
}

export default function WalletPage() {
  const { user, refreshUser } = useAuth()
  const [txs,     setTxs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showW,   setShowW]   = useState(false)
  const [wForm,   setWForm]   = useState({ amount: '', phone: '' })
  const [wLoad,   setWLoad]   = useState(false)
  const [wMsg,    setWMsg]    = useState({ type: '', text: '' })

  useEffect(() => {
    api.get('/users/my/transactions')
      .then(r => setTxs(r.data.transactions || []))
      .finally(() => setLoading(false))
    refreshUser()
  }, [])

  const totalEarned = txs
    .filter(t => (t.type === 'chat_earning' || t.type === 'earning') && t.status === 'completed')
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const activationPaid = txs
    .filter(t => t.type === 'activation_fee' && t.status === 'completed')
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const handleWithdraw = async e => {
    e.preventDefault()
    setWMsg({ type: '', text: '' })
    setWLoad(true)
    try {
      const { data } = await api.post('/users/my/withdraw', {
        amount: Number(wForm.amount), phone: wForm.phone,
      })
      setWMsg({ type: 'success', text: data.message })
      refreshUser()
      setWForm({ amount: '', phone: '' })
      setTimeout(() => setShowW(false), 2500)
    } catch (e) {
      setWMsg({ type: 'error', text: e.response?.data?.error || 'Withdrawal failed' })
    } finally { setWLoad(false) }
  }

  const balance = parseFloat(user?.balance || 0)

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">My Wallet</h1>
        <p className="page-sub">Your earnings from chatting with foreigners</p>
      </div>

      {/* Balance card */}
      <div className="relative glass-strong rounded-3xl p-6 mb-5 border border-primary-500/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none"/>
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary-500/8 rounded-full blur-2xl pointer-events-none"/>
        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-gray-400 text-sm mb-1">Available Balance</div>
              <div className="font-display text-4xl font-bold text-white">{fmtKES(balance)}</div>
            </div>
            <div className="w-11 h-11 bg-primary-500/20 rounded-2xl flex items-center justify-center">
              <Wallet size={20} className="text-primary-400"/>
            </div>
          </div>

          {/* Earning explanation */}
          <div className="flex items-center gap-2 p-3 bg-dark-700/60 rounded-xl border border-white/5 mb-4">
            <Zap size={13} className="text-yellow-400 flex-shrink-0"/>
            <p className="text-xs text-gray-400">
              {user?.is_foreigner
                ? 'You are listed as a foreigner. Your balance grows as users chat with you.'
                : 'You earn money for every message you send while chatting with foreigners.'}
            </p>
          </div>

          <div className="flex gap-6 text-sm mb-4">
            <div>
              <div className="text-gray-500 text-xs mb-0.5 flex items-center gap-1"><TrendingUp size={11}/> Total Earned</div>
              <div className="text-green-400 font-semibold">{fmtKES(totalEarned)}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-0.5 flex items-center gap-1"><MessageCircle size={11}/> Activation Paid</div>
              <div className="text-orange-400 font-semibold">{fmtKES(activationPaid)}</div>
            </div>
          </div>

          {balance >= 200
            ? <button onClick={() => setShowW(true)} className="btn-primary text-sm py-2.5 px-5">
                <ArrowUpRight size={15}/> Withdraw to M-Pesa
              </button>
            : <p className="text-xs text-gray-500">
                Minimum withdrawal: KES 200.{' '}
                {!user?.is_foreigner && <span className="text-primary-400">Keep chatting to earn more!</span>}
              </p>
          }
        </div>
      </div>

      {/* How to earn guide */}
      {!user?.is_foreigner && (
        <div className="glass rounded-2xl border border-white/5 p-4 mb-5">
          <h3 className="font-display font-semibold text-white text-sm mb-3 flex items-center gap-2">
            <DollarSign size={14} className="text-primary-400"/> How You Earn
          </h3>
          <div className="space-y-2">
            {[
              { n: '1', text: 'Pay one-time activation fee (KES 100) to unlock all foreigners' },
              { n: '2', text: 'Start a chat with any foreigner — it\'s free after activation' },
              { n: '3', text: 'Send messages and earn KES 3 for each message sent' },
              { n: '4', text: 'Withdraw to M-Pesa when your balance reaches KES 200' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary-400 text-xs font-bold">{s.n}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Activations', value: txs.filter(t => t.type === 'activation_fee').length,                 icon: MessageCircle, c: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'Earnings',    value: txs.filter(t => t.type === 'chat_earning' || t.type === 'earning').length, icon: TrendingUp, c: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Total TXs',  value: txs.length,                                                            icon: Wallet,       c: 'text-primary-400', bg: 'bg-primary-500/10' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 border border-white/5 text-center">
            <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <s.icon size={15} className={s.c}/>
            </div>
            <div className="text-xl font-display font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <h2 className="font-display font-semibold text-white mb-3 text-sm">Transaction History</h2>
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="glass rounded-xl h-14 animate-pulse border border-white/5"/>)}
        </div>
      ) : txs.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">No transactions yet. Start chatting to earn!</div>
      ) : (
        <div className="space-y-2">
          {txs.map(tx => {
            const ti = TX_TYPE[tx.type] || { label: tx.type, color: 'text-gray-400', bg: 'bg-gray-500/10', sign: '' }
            const S  = STATUS[tx.status] || STATUS.pending
            return (
              <div key={tx.id} className="glass flex items-center gap-3 p-3.5 rounded-xl border border-white/5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ti.bg}`}>
                  {ti.sign === '+'
                    ? <TrendingUp size={16} className={ti.color}/>
                    : <ArrowUpRight size={16} className={ti.color}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {tx.description || ti.label}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <span className={`badge ${S.cls} text-xs`}>{S.label}</span>
                    {tx.mpesa_ref && <span className="font-mono">· {String(tx.mpesa_ref).slice(0, 10)}</span>}
                    <span>· {timeAgo(tx.created_at)}</span>
                  </div>
                </div>
                <div className={`text-sm font-semibold font-display flex-shrink-0 ${ti.color}`}>
                  {ti.sign}{fmtKES(tx.amount)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Withdraw modal */}
      {showW && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowW(false)}/>
          <div className="relative glass-strong rounded-3xl p-6 w-full max-w-sm border border-white/10 animate-slide-up">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-xl font-bold text-white">Withdraw to M-Pesa</h3>
              <button onClick={() => setShowW(false)} className="text-gray-400 hover:text-white"><X size={18}/></button>
            </div>
            <p className="text-gray-400 text-sm mb-5">Funds sent to your M-Pesa within minutes</p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Amount (KES)</label>
                <input type="number" value={wForm.amount}
                  onChange={e => setWForm(f => ({ ...f, amount: e.target.value }))}
                  className="input-field" placeholder="Min. KES 200" min="200" max={balance} required/>
                <p className="text-xs text-gray-600 mt-1">Available: {fmtKES(balance)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">M-Pesa Phone Number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                  <input type="tel" value={wForm.phone}
                    onChange={e => setWForm(f => ({ ...f, phone: e.target.value }))}
                    className="input-field pl-10" placeholder="07XX XXX XXX" required/>
                </div>
              </div>
              {wMsg.text && (
                <div className={`text-sm p-3 rounded-xl ${wMsg.type === 'success'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {wMsg.text}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowW(false)} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
                <button type="submit" disabled={wLoad} className="btn-primary flex-1 text-sm py-2.5">
                  {wLoad ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
