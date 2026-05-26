import { useState, useEffect, useCallback } from 'react'
import { Search, Ban, CheckCircle, Globe2, Trash2, UserPlus, X } from 'lucide-react'
import { adminApi } from '../../context/AdminAuthContext'
import { timeAgo, fmtKES } from '../../utils/helpers'

function AddForeignerModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name:'', email:'', country:'', country_code:'', bio:'', language:'English' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('')
    try { await adminApi.post('/admin/users/add-foreigner', form); onAdded(); onClose() }
    catch(e) { setError(e.response?.data?.error || 'Failed to add') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}/>
      <div className="relative bg-dark-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-white text-sm">Add Foreigner</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={16}/></button>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-red-400 text-xs">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          {[
            {f:'name',         l:'Full name',         req:true },
            {f:'email',        l:'Email',              req:true },
            {f:'country',      l:'Country',            req:true },
            {f:'country_code', l:'Country code (e.g. US)', req:false },
            {f:'language',     l:'Language',           req:false },
          ].map(({f,l,req})=>(
            <div key={f}>
              <label className="text-xs text-gray-400 mb-1 block">{l}</label>
              <input type={f==='email'?'email':'text'} value={form[f]} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))}
                className="input-field text-sm py-2" required={req}/>
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Bio</label>
            <textarea value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))}
              className="input-field text-sm py-2 resize-none" rows={2}/>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-xs py-2">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 text-xs py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-1">
              {loading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Add Foreigner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers]       = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [type, setType]         = useState('')
  const [status, setStatus]     = useState('')
  const [page, setPage]         = useState(1)
  const [busy, setBusy]         = useState('')
  const [showAdd, setShowAdd]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit:20, search, type, status }
      const { data } = await adminApi.get('/admin/users', { params })
      setUsers(data.users || []); setTotal(data.total || 0)
    } finally { setLoading(false) }
  }, [page, search, type, status])

  useEffect(() => { const t = setTimeout(load,300); return ()=>clearTimeout(t) }, [load])

  const act = async (url, id, confirm_msg) => {
    if (!confirm(confirm_msg)) return
    setBusy(id)
    try { await adminApi.put(url); load() }
    catch(e) { alert(e.response?.data?.error||'Failed') }
    finally { setBusy('') }
  }

  const del = async id => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return
    setBusy(id)
    try { await adminApi.delete(`/admin/users/${id}`); load() }
    finally { setBusy('') }
  }

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">{total} total users</p>
        </div>
        <button onClick={()=>setShowAdd(true)}
          className="flex items-center gap-2 text-sm px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-all">
          <UserPlus size={15}/>Add Foreigner
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-44">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
            className="input-field pl-9 text-sm py-2" placeholder="Search name, email, country…"/>
        </div>
        <select value={type} onChange={e=>{setType(e.target.value);setPage(1)}} className="input-field text-sm py-2 w-36">
          <option value="">All types</option>
          <option value="user">Users</option>
          <option value="foreigner">Foreigners</option>
        </select>
        <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}} className="input-field text-sm py-2 w-36">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      <div className="bg-dark-800/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5">
                {['User','Country','Type','Status','Balance','Joined','Actions'].map(h=>(
                  <th key={h} className="tbl-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/3">
              {loading
                ? [...Array(5)].map((_,i)=><tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-7 bg-white/3 rounded animate-pulse"/></td></tr>)
                : users.length === 0
                  ? <tr><td colSpan={7} className="text-center py-10 text-gray-600 text-sm">No users found</td></tr>
                  : users.map(u=>(
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="tbl-cell">
                    <div className="flex items-center gap-2">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} className="w-7 h-7 rounded-full flex-shrink-0"/>
                      <div>
                        <div className="text-white font-medium text-xs">{u.name}</div>
                        <div className="text-gray-500 text-xs truncate max-w-[140px]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="tbl-cell text-gray-400 text-xs">{u.country}</td>
                  <td className="tbl-cell">{u.is_foreigner?<span className="badge badge-purple">Foreigner</span>:<span className="badge badge-blue">User</span>}</td>
                  <td className="tbl-cell">{u.is_banned?<span className="badge badge-red">Banned</span>:<span className="badge badge-green">{u.is_online?'Online':'Active'}</span>}</td>
                  <td className="tbl-cell text-gray-300 text-xs font-mono">{fmtKES(u.balance||0)}</td>
                  <td className="tbl-cell text-gray-500 text-xs">{timeAgo(u.created_at)}</td>
                  <td className="tbl-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>act(`/admin/users/${u.id}/ban`, u.id, u.is_banned?'Unban this user?':'Ban this user?')}
                        disabled={busy===u.id}
                        className={`p-1.5 rounded-lg transition-colors ${u.is_banned?'text-green-400 hover:bg-green-500/10':'text-red-400 hover:bg-red-500/10'}`} title={u.is_banned?'Unban':'Ban'}>
                        <Ban size={13}/>
                      </button>
                      <button onClick={()=>act(`/admin/users/${u.id}/verify`, u.id, u.is_verified?'Remove verification?':'Verify this user?')}
                        disabled={busy===u.id}
                        className={`p-1.5 rounded-lg transition-colors ${u.is_verified?'text-yellow-400 hover:bg-yellow-500/10':'text-gray-400 hover:bg-white/5'}`} title={u.is_verified?'Unverify':'Verify'}>
                        <CheckCircle size={13}/>
                      </button>
                      <button onClick={()=>act(`/admin/users/${u.id}/toggle-foreigner`, u.id, 'Toggle foreigner status?')}
                        disabled={busy===u.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-white/5 transition-colors" title="Toggle foreigner">
                        <Globe2 size={13}/>
                      </button>
                      <button onClick={()=>del(u.id)} disabled={busy===u.id}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>Showing {(page-1)*20+1}–{Math.min(page*20,total)} of {total}</span>
          <div className="flex gap-2">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Prev</button>
            <button onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/20)} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {showAdd && <AddForeignerModal onClose={()=>setShowAdd(false)} onAdded={load}/>}
    </div>
  )
}
