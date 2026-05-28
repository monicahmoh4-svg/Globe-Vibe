import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe2, User, Mail, Lock, Eye, EyeOff, MapPin, ArrowRight, DollarSign, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { COUNTRIES } from '../../utils/helpers'

export default function Register() {
  const [form, setForm] = useState({
    name:'', email:'', password:'', country:'', country_code:'',
    language:'English', bio:'', is_foreigner: false,
  })
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const { register } = useAuth()
  const nav = useNavigate()
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleCountry = e => {
    const found = COUNTRIES.find(c=>c.name===e.target.value)
    set('country', e.target.value)
    set('country_code', found?.code||'')
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
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-primary-500/6 rounded-full blur-3xl pointer-events-none"/>
      <div className="w-full max-w-sm relative">

        <div className="text-center mb-7">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Globe2 size={17} className="text-white"/>
            </div>
            <span className="font-display font-bold text-xl text-white">GlobeVibe</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-gray-400 text-sm">Join and start earning by chatting with foreigners</p>
        </div>

        <div className="glass-strong rounded-3xl p-6 border border-white/10">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3.5">
            {/* Name */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Full name</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input type="text" value={form.name} onChange={e=>set('name',e.target.value)}
                  className="input-field pl-10 text-sm" placeholder="Your full name" required minLength={2}/>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input type="email" value={form.email} onChange={e=>set('email',e.target.value)}
                  className="input-field pl-10 text-sm" placeholder="you@example.com" required/>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input type={show?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)}
                  className="input-field pl-10 pr-10 text-sm" placeholder="At least 6 characters" required minLength={6}/>
                <button type="button" onClick={()=>setShow(v=>!v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {show ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Country</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"/>
                <select value={form.country} onChange={handleCountry}
                  className="input-field pl-10 text-sm appearance-none cursor-pointer" required>
                  <option value="">Select your country</option>
                  {COUNTRIES.map(c=><option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Language(s) spoken</label>
              <input type="text" value={form.language} onChange={e=>set('language',e.target.value)}
                className="input-field text-sm" placeholder="e.g. English, Swahili"/>
            </div>

            {/* ── FOREIGNER TOGGLE ────────────────────────────────────────── */}
            <div className={`rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 ${form.is_foreigner ? 'border-primary-500/60 bg-primary-500/10' : 'border-white/10 bg-white/3 hover:border-white/20'}`}
              onClick={()=>set('is_foreigner',!form.is_foreigner)}>
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${form.is_foreigner ? 'border-primary-500 bg-primary-500' : 'border-gray-600'}`}>
                  {form.is_foreigner && <div className="w-2 h-2 rounded-full bg-white"/>}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={14} className="text-primary-400"/>
                    <span className="text-sm font-semibold text-white">I want to earn as a Foreigner</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Register as a foreigner to be listed on the platform. Users will pay an activation fee to chat with you and earn money from those conversations.
                  </p>
                </div>
              </div>
            </div>

            {form.is_foreigner && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Short bio (shown on your profile)</label>
                <textarea value={form.bio} onChange={e=>set('bio',e.target.value)} rows={2}
                  className="input-field text-sm resize-none"
                  placeholder="Tell people about yourself, your culture and what you enjoy talking about…"/>
              </div>
            )}

            {/* How it works hint */}
            <div className="flex items-start gap-2 p-3 bg-dark-700/50 rounded-xl border border-white/5">
              <Info size={13} className="text-gray-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-gray-500 leading-relaxed">
                {form.is_foreigner
                  ? 'As a foreigner, you appear in the browse list. Users pay an activation fee to connect with you. You are the reason they can earn — the more interesting you are, the more connections you attract!'
                  : 'As a user, you pay a small activation fee to connect with foreigners, then earn money per message you send during the chat session.'}
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1 text-sm">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <><span>{form.is_foreigner ? 'Join as Foreigner' : 'Create Account & Earn'}</span><ArrowRight size={15}/></>
              }
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
