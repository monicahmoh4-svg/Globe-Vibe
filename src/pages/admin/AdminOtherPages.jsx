import { useState, useEffect, useCallback } from 'react'
import { Check, X, Eye } from 'lucide-react'
import { adminApi } from '../../context/AdminAuthContext'
import { fmtKES, timeAgo } from '../../utils/helpers'

// ── Shared ──────────────────────────────────────────────────────────────────
const Spinner = () => <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto"/>

function StatusBadge({ s }) {
  const map = { completed:'badge-green', pending:'badge-orange', failed:'badge-red', approved:'badge-green', rejected:'badge-red', resolved:'badge-green', dismissed:'badge-blue' }
  return <span className={`badge ${map[s]||'badge-orange'} text-xs capitalize`}>{s}</span>
}

// ── Transactions ─────────────────────────────────────────────────────────────
export function AdminTransactions() {
  const [rows, setRows]     = useState([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoad]  = useState(true)
  const [page, setPage]     = useState(1)
  const [sf, setSf]         = useState('')
  const [tf, setTf]         = useState('')

  const load = useCallback(async () => {
    setLoad(true)
    try {
      const p = { page, limit:20 }
      if (sf) p.status = sf
      if (tf) p.type   = tf
      const { data } = await adminApi.get('/admin/transactions', { params: p })
      setRows(data.transactions||[]); setTotal(data.total||0)
    } finally { setLoad(false) }
  }, [page, sf, tf])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <p className="page-sub">{total} total</p>
      </div>
      <div className="flex gap-3 mb-5">
        <select value={sf} onChange={e=>{setSf(e.target.value);setPage(1)}} className="input-field text-sm py-2 w-40">
          <option value="">All status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select value={tf} onChange={e=>{setTf(e.target.value);setPage(1)}} className="input-field text-sm py-2 w-44">
          <option value="">All types</option>
          <option value="connection_payment">Payments</option>
          <option value="earning">Earnings</option>
        </select>
      </div>
      <div className="bg-dark-800/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="border-b border-white/5">{['User','Type','Amount','Status','M-Pesa Ref','Date'].map(h=><th key={h} className="tbl-header">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-white/3">
              {loading ? [...Array(4)].map((_,i)=><tr key={i}><td colSpan={6}><div className="h-7 bg-white/3 rounded m-3 animate-pulse"/></td></tr>)
                : rows.map(tx=>(
                <tr key={tx.id} className="hover:bg-white/2">
                  <td className="tbl-cell"><div className="text-white text-xs font-medium">{tx.user_name}</div><div className="text-gray-500 text-xs">{tx.user_email}</div></td>
                  <td className="tbl-cell"><span className={`badge text-xs ${tx.type==='earning'?'badge-green':'badge-blue'}`}>{tx.type==='connection_payment'?'Payment':'Earning'}</span></td>
                  <td className="tbl-cell font-mono text-gray-300 text-xs">{fmtKES(tx.amount)}</td>
                  <td className="tbl-cell"><StatusBadge s={tx.status}/></td>
                  <td className="tbl-cell font-mono text-gray-500 text-xs">{tx.mpesa_ref||'—'}</td>
                  <td className="tbl-cell text-gray-500 text-xs">{timeAgo(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {total>20&&<div className="flex justify-end gap-2 mt-4"><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Prev</button><button onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/20)} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Next</button></div>}
    </div>
  )
}

// ── Withdrawals ───────────────────────────────────────────────────────────────
export function AdminWithdrawals() {
  const [rows, setRows]         = useState([])
  const [loading, setLoad]      = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [processing, setProc]   = useState('')
  const [rejectId, setRejectId] = useState(null)
  const [note, setNote]         = useState('')

  const load = useCallback(async () => {
    setLoad(true)
    try {
      const { data } = await adminApi.get('/admin/withdrawals', { params: filter ? {status:filter} : {} })
      setRows(data.withdrawals||[])
    } finally { setLoad(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  const process = async (id, status, admin_note='') => {
    setProc(id)
    try { await adminApi.put(`/admin/withdrawals/${id}`, { status, admin_note }); setRejectId(null); setNote(''); load() }
    catch(e) { alert(e.response?.data?.error||'Failed') }
    finally { setProc('') }
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Withdrawal Requests</h1>
        <p className="page-sub">Review and process user withdrawal requests</p>
      </div>
      <div className="flex gap-2 mb-5">
        {['pending','approved','rejected',''].map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            className={`text-xs px-3.5 py-2 rounded-xl transition-all ${filter===s?'bg-red-600/20 text-red-400 border border-red-500/20':'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            {s||'All'}
          </button>
        ))}
      </div>
      {loading ? <Spinner/> : rows.length===0 ? <div className="text-center py-12 text-gray-600 text-sm">No withdrawal requests</div> : (
        <div className="space-y-3">
          {rows.map(w=>(
            <div key={w.id} className={`bg-dark-800/50 border rounded-2xl p-4 flex items-center gap-4 ${w.status==='pending'?'border-orange-500/20':'border-white/5'}`}>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{w.user_name}</div>
                <div className="text-gray-500 text-xs">{w.user_email} · {w.phone}</div>
                <div className="text-gray-600 text-xs mt-0.5">{timeAgo(w.created_at)}</div>
                {w.admin_note && <div className="text-xs text-gray-500 mt-1 italic">Note: {w.admin_note}</div>}
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-white">{fmtKES(w.amount)}</div>
                <StatusBadge s={w.status}/>
              </div>
              {w.status==='pending' && (
                <div className="flex gap-2 ml-2">
                  <button onClick={()=>process(w.id,'approved')} disabled={processing===w.id}
                    className="p-2 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 transition-colors" title="Approve">
                    <Check size={14}/>
                  </button>
                  <button onClick={()=>setRejectId(w.id)} disabled={processing===w.id}
                    className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors" title="Reject">
                    <X size={14}/>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={()=>setRejectId(null)}/>
          <div className="relative bg-dark-800 border border-white/10 rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-display font-semibold text-white mb-3 text-sm">Reject Withdrawal</h3>
            <textarea value={note} onChange={e=>setNote(e.target.value)} className="input-field resize-none mb-4 text-sm" rows={3} placeholder="Reason for rejection (optional)"/>
            <div className="flex gap-2">
              <button onClick={()=>setRejectId(null)} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
              <button onClick={()=>process(rejectId,'rejected',note)} className="flex-1 text-sm py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Reports ───────────────────────────────────────────────────────────────────
export function AdminReports() {
  const [rows, setRows]   = useState([])
  const [loading, setLoad]= useState(true)

  const load = async () => {
    setLoad(true)
    try { const { data } = await adminApi.get('/admin/reports'); setRows(data.reports||[]) }
    finally { setLoad(false) }
  }

  useEffect(() => { load() }, [])

  const update = async (id, status) => {
    await adminApi.put(`/admin/reports/${id}`, { status }); load()
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">User Reports</h1>
        <p className="page-sub">{rows.filter(r=>r.status==='pending').length} pending reports</p>
      </div>
      {loading ? <Spinner/> : rows.length===0 ? <div className="text-center py-12 text-gray-600 text-sm">No reports</div> : (
        <div className="space-y-3">
          {rows.map(r=>(
            <div key={r.id} className={`bg-dark-800/50 border rounded-2xl p-4 ${r.status==='pending'?'border-orange-500/20':'border-white/5'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm text-white font-medium mb-0.5">
                    <span className="text-gray-400">{r.reporter_name}</span> reported <span className="text-red-400">{r.reported_name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">Reason: <span className="text-orange-400 capitalize">{r.reason}</span> · {timeAgo(r.created_at)}</div>
                  {r.description && <div className="text-xs text-gray-400 bg-white/5 rounded-lg p-2 mt-1">{r.description}</div>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge s={r.status}/>
                  {r.status==='pending' && (
                    <>
                      <button onClick={()=>update(r.id,'resolved')} className="p-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors" title="Resolve"><Check size={13}/></button>
                      <button onClick={()=>update(r.id,'dismissed')} className="p-1.5 bg-gray-500/10 text-gray-400 rounded-lg hover:bg-gray-500/20 transition-colors" title="Dismiss"><X size={13}/></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Connections ───────────────────────────────────────────────────────────────
export function AdminConnections() {
  const [rows, setRows]     = useState([])
  const [loading, setLoad]  = useState(true)
  const [viewId, setViewId] = useState(null)
  const [msgs, setMsgs]     = useState([])
  const [mLoad, setMLoad]   = useState(false)

  useEffect(() => {
    adminApi.get('/admin/connections').then(r=>setRows(r.data.connections||[])).finally(()=>setLoad(false))
  }, [])

  const viewMsgs = async id => {
    setViewId(id); setMLoad(true)
    try { const { data } = await adminApi.get(`/admin/connections/${id}/messages`); setMsgs(data.messages||[]) }
    finally { setMLoad(false) }
  }

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Connections</h1>
        <p className="page-sub">{rows.length} connections</p>
      </div>
      <div className="bg-dark-800/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="border-b border-white/5">{['User','Foreigner','Status','Amount','Msgs','Date',''].map(h=><th key={h} className="tbl-header">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-white/3">
              {loading ? [...Array(4)].map((_,i)=><tr key={i}><td colSpan={7}><div className="h-7 bg-white/3 rounded m-3 animate-pulse"/></td></tr>)
                : rows.map(c=>(
                <tr key={c.id} className="hover:bg-white/2">
                  <td className="tbl-cell text-xs text-white">{c.user_name}</td>
                  <td className="tbl-cell text-xs text-white">{c.foreigner_name} <span className="text-gray-500">({c.foreigner_country})</span></td>
                  <td className="tbl-cell"><StatusBadge s={c.payment_status}/></td>
                  <td className="tbl-cell font-mono text-xs text-gray-300">{fmtKES(c.amount_paid)}</td>
                  <td className="tbl-cell text-xs text-gray-400">{c.message_count}</td>
                  <td className="tbl-cell text-xs text-gray-500">{timeAgo(c.created_at)}</td>
                  <td className="tbl-cell"><button onClick={()=>viewMsgs(c.id)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Eye size={13}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {viewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={()=>setViewId(null)}/>
          <div className="relative bg-dark-800 border border-white/10 rounded-2xl p-5 w-full max-w-lg max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white text-sm">Chat Messages</h3>
              <button onClick={()=>setViewId(null)} className="text-gray-400 hover:text-white"><X size={15}/></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {mLoad ? <Spinner/> : msgs.length===0 ? <div className="text-center py-8 text-gray-600 text-sm">No messages</div>
                : msgs.map(m=>(
                <div key={m.id} className="text-xs">
                  <span className="text-primary-400 font-medium">{m.sender_name}:</span>{' '}
                  <span className="text-gray-300">{m.content}</span>
                  <span className="text-gray-600 ml-2">{timeAgo(m.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Settings ──────────────────────────────────────────────────────────────────
export function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoad]      = useState(true)
  const [saving, setSave]       = useState(false)
  const [msg, setMsg]           = useState('')

  useEffect(() => {
    adminApi.get('/admin/settings').then(r=>setSettings(r.data.settings||[])).finally(()=>setLoad(false))
  }, [])

  const save = async () => {
    setSave(true); setMsg('')
    try { await adminApi.put('/admin/settings', { settings }); setMsg('Settings saved!'); setTimeout(()=>setMsg(''),3000) }
    catch { setMsg('Failed to save') }
    finally { setSave(false) }
  }

  const update = (key, value) => setSettings(prev => prev.map(s => s.key===key ? {...s,value} : s))

  return (
    <div className="p-5 max-w-xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Platform Settings</h1>
        <p className="page-sub">Configure how GlobeVibe operates</p>
      </div>
      {msg && <div className={`p-3 rounded-xl mb-4 text-sm ${msg.includes('Failed')?'bg-red-500/10 text-red-400 border border-red-500/20':'bg-green-500/10 text-green-400 border border-green-500/20'}`}>{msg}</div>}
      <div className="bg-dark-800/50 border border-white/5 rounded-2xl divide-y divide-white/5">
        {loading ? [...Array(6)].map((_,i)=><div key={i} className="p-4"><div className="h-10 bg-white/3 rounded-xl animate-pulse"/></div>)
          : settings.map(s=>(
          <div key={s.key} className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium text-white capitalize">{s.key.replace(/_/g,' ')}</div>
              <div className="text-xs text-gray-500">{s.description}</div>
            </div>
            {(s.value==='true'||s.value==='false')
              ? <button onClick={()=>update(s.key, s.value==='true'?'false':'true')}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${s.value==='true'?'bg-primary-500':'bg-dark-600'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${s.value==='true'?'left-5.5 translate-x-0.5':'left-0.5'}`}/>
                </button>
              : <input type={isNaN(Number(s.value))?'text':'number'} value={s.value}
                  onChange={e=>update(s.key,e.target.value)}
                  className="input-field w-28 text-sm py-2 text-right flex-shrink-0"/>
            }
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="btn-primary mt-5 bg-red-600 hover:bg-red-500 shadow-none">
        {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Save All Settings'}
      </button>
    </div>
  )
}
