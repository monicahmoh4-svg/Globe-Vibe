import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, User, Lock, Eye, EyeOff } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminLogin() {
  const [form, setForm] = useState({ username:'', password:'' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { adminLogin } = useAdminAuth()
  const nav = useNavigate()

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await adminLogin(form.username, form.password); nav('/admin/dashboard') }
    catch(e) { setError(e.response?.data?.error || 'Invalid credentials') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-dark-900">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-red-500/5 rounded-full blur-3xl pointer-events-none"/>
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-900/30">
            <Shield size={24} className="text-white"/>
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Admin Access</h1>
          <p className="text-gray-500 text-sm">GlobeVibe Control Panel</p>
        </div>

        <div className="glass-strong rounded-3xl p-7 border border-white/8">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5 text-red-400 text-sm flex items-center gap-2"><Shield size={13}/>{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Username</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input type="text" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}
                  className="input-field pl-10" placeholder="admin" required autoComplete="username"/>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input type={show?'text':'password'} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                  className="input-field pl-10 pr-10" placeholder="••••••••••" required autoComplete="current-password"/>
                <button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {show ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-display font-semibold rounded-xl transition-all mt-2 flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 disabled:opacity-60">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in…</>
                : <><Shield size={15}/>Access Dashboard</>}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-700 mt-5">GlobeVibe Admin · Restricted Area</p>
      </div>
    </div>
  )
}
