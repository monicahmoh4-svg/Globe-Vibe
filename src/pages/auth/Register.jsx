import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe2, User, Mail, Lock, Eye, EyeOff, MapPin, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { COUNTRIES } from '../../utils/helpers'

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', country:'', country_code:'', language:'English' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { register } = useAuth()
  const nav = useNavigate()
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleCountry = e => {
    const found = COUNTRIES.find(c=>c.name===e.target.value)
    set('country', e.target.value); set('country_code', found?.code||'')
  }

  const submit = async e => {
    e.preventDefault(); setError('')
    if (!form.country) { setError('Please select your country'); return }
    setLoading(true)
    try { await register(form); nav('/dashboard') }
    catch(err) { setError(err.response?.data?.error || 'Registration failed.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-primary-500/6 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Globe2 size={17} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">GlobeVibe</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Join GlobeVibe</h1>
          <p className="text-gray-400 text-sm">Create your free account and start connecting</p>
        </div>

        <div className="glass-strong rounded-3xl p-7 border border-white/10">
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">⚠️ {error}</div>}
          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Full name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" value={form.name} onChange={e=>set('name',e.target.value)}
                  className="input-field pl-10" placeholder="Your full name" required minLength={2} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={form.email} onChange={e=>set('email',e.target.value)}
                  className="input-field pl-10" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={show?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)}
                  className="input-field pl-10 pr-10" placeholder="At least 6 characters" required minLength={6} />
                <button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Country</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <select value={form.country} onChange={handleCountry} className="input-field pl-10 appearance-none cursor-pointer" required>
                  <option value="">Select your country</option>
                  {COUNTRIES.map(c=><option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Language</label>
              <input type="text" value={form.language} onChange={e=>set('language',e.target.value)}
                className="input-field" placeholder="e.g. English, Swahili" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
              {loading ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/></span>
                : <><span>Create Free Account</span><ArrowRight size={16}/></>}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
