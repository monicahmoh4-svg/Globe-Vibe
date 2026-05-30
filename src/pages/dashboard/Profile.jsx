import { useState } from 'react'
import { User, MessageCircle, Star, Edit3, Save, X, Lock, ChevronDown, Globe2, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { flag, fmtKES, fmtDate } from '../../utils/helpers'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({ name: user?.name || '', bio: user?.bio || '', language: user?.language || '' })
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving,  setSaving]  = useState(false)
  const [pwdSave, setPwdSave] = useState(false)
  const [msg,     setMsg]     = useState({ type: '', text: '' })
  const [pwdMsg,  setPwdMsg]  = useState({ type: '', text: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [showFg,  setShowFg]  = useState(false)
  const [fgForm,  setFgForm]  = useState({ bio: user?.bio || '', languages: user?.language || '', motivation: '' })
  const [fgLoad,  setFgLoad]  = useState(false)
  const [fgMsg,   setFgMsg]   = useState({ type: '', text: '' })

  if (!user) return null

  const saveProfile = async () => {
    setSaving(true); setMsg({ type: '', text: '' })
    try {
      await api.put('/users/profile/update', form)
      await refreshUser()
      setEditing(false)
      setMsg({ type: 'success', text: 'Profile updated!' })
      setTimeout(() => setMsg({ type: '', text: '' }), 3000)
    } catch (e) { setMsg({ type: 'error', text: e.response?.data?.error || 'Failed to save' }) }
    finally { setSaving(false) }
  }

  const changePwd = async e => {
    e.preventDefault()
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { setPwdMsg({ type: 'error', text: "Passwords don't match" }); return }
    setPwdSave(true)
    try {
      await api.put('/users/profile/password', { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword })
      setPwdMsg({ type: 'success', text: 'Password changed!' })
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (e) { setPwdMsg({ type: 'error', text: e.response?.data?.error || 'Failed' }) }
    finally { setPwdSave(false) }
  }

  const handleForeigner = async () => {
    setFgLoad(true); setFgMsg({ type: '', text: '' })
    try {
      const { data } = await api.post('/users/become-foreigner', fgForm)
      setFgMsg({ type: 'success', text: data.message })
      await refreshUser()
      setTimeout(() => setShowFg(false), 2000)
    } catch (e) { setFgMsg({ type: 'error', text: e.response?.data?.error || 'Failed' }) }
    finally { setFgLoad(false) }
  }

  return (
    <div className="p-5 max-w-xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-sub">Manage your account information</p>
      </div>

      {msg.text && (
        <div className={`rounded-xl p-3 mb-4 text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {msg.type === 'success' ? <CheckCircle size={14}/> : <AlertCircle size={14}/>} {msg.text}
        </div>
      )}

      {/* Avatar card */}
      <div className="card border border-white/5 mb-4">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              className="w-[72px] h-[72px] rounded-2xl bg-dark-600"/>
            {user.is_online && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-dark-800 animate-pulse"/>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="font-display text-lg font-bold text-white">{user.name}</h2>
              {user.is_verified  && <span className="badge badge-green">✓ Verified</span>}
              {user.is_foreigner && <span className="badge badge-purple">Foreigner</span>}
              {user.is_activated && <span className="badge badge-blue">✓ Activated</span>}
            </div>
            <p className="text-gray-400 text-sm mb-2">{user.email}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span>{flag(user.country_code)} {user.country}</span>
              <span className="flex items-center gap-1"><MessageCircle size={11}/>{user.total_chats} chats</span>
              {user.is_foreigner && <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400"/>{Number(user.rating).toFixed(1)}</span>}
              <span className="flex items-center gap-1"><DollarSign size={11} className="text-green-400"/>{fmtKES(user.total_earned)} earned</span>
              <span>Joined {fmtDate(user.created_at)}</span>
            </div>
          </div>
          <button onClick={() => { setEditing(v => !v); if (!editing) setForm({ name: user.name || '', bio: user.bio || '', language: user.language || '' }) }}
            className={editing ? 'btn-ghost text-red-400 hover:text-red-300 text-sm' : 'btn-secondary text-sm py-2 px-4'}>
            {editing ? <><X size={13}/>Cancel</> : <><Edit3 size={13}/>Edit</>}
          </button>
        </div>
      </div>

      {/* Profile info */}
      <div className="card border border-white/5 mb-4">
        <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2 text-sm">
          <User size={14} className="text-primary-400"/> Profile Info
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Display name', field: 'name',     placeholder: 'Your name'                },
            { label: 'Languages',    field: 'language',  placeholder: 'e.g. English, Swahili'    },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
              <input value={editing ? form[field] : (user[field] || '')}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                disabled={!editing} placeholder={placeholder}
                className="input-field text-sm disabled:opacity-50 disabled:cursor-not-allowed"/>
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Bio</label>
            <textarea value={editing ? form.bio : (user.bio || '')}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              disabled={!editing} rows={3} placeholder="Tell people about yourself…"
              className="input-field text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"/>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Country</label>
            <div className="input-field text-sm opacity-50 cursor-not-allowed">{flag(user.country_code)} {user.country}</div>
          </div>
          {editing && (
            <button onClick={saveProfile} disabled={saving} className="btn-primary text-sm py-2.5 px-5">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Save size={13}/>Save Changes</>}
            </button>
          )}
        </div>
      </div>

      {/* Become / Leave Foreigner */}
      <div className={`card border mb-4 ${user.is_foreigner ? 'border-purple-500/20 bg-purple-500/5' : 'border-white/5'}`}>
        <button onClick={() => setShowFg(v => !v)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${user.is_foreigner ? 'bg-purple-500/20' : 'bg-primary-500/10'}`}>
              <Globe2 size={15} className={user.is_foreigner ? 'text-purple-400' : 'text-primary-400'}/>
            </div>
            <div className="text-left">
              <div className="font-display font-semibold text-white text-sm">
                {user.is_foreigner ? 'You are listed as a Foreigner' : 'Become a Foreigner'}
              </div>
              <div className="text-xs text-gray-500">
                {user.is_foreigner ? 'Users can start free chats with you' : 'Get listed so users can chat with you'}
              </div>
            </div>
          </div>
          <ChevronDown size={16} className={`text-gray-500 transition-transform ${showFg ? 'rotate-180' : ''}`}/>
        </button>

        {showFg && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
            {user.is_foreigner ? (
              <>
                <div className="flex items-start gap-2 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <CheckCircle size={14} className="text-purple-400 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-purple-300">You are currently listed. Users can browse your profile and start free chats with you after they activate their account.</p>
                </div>
                {fgMsg.text && (
                  <div className={`text-sm p-3 rounded-xl ${fgMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {fgMsg.text}
                  </div>
                )}
                <button onClick={handleForeigner} disabled={fgLoad}
                  className="btn-secondary text-sm py-2.5 w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
                  {fgLoad ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Remove me from Foreigners list'}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-400 leading-relaxed">Register as a foreigner to appear in the browse page. Users who have activated their account can start free chats with you.</p>
                {[
                  { label: 'Update your bio', field: 'bio', placeholder: 'Tell users about yourself and your culture…', type: 'textarea' },
                  { label: 'Languages you speak', field: 'languages', placeholder: 'e.g. English, Swahili, French', type: 'input' },
                  { label: 'Why do you want to join?', field: 'motivation', placeholder: 'e.g. I want to share my culture and make friends', type: 'input' },
                ].map(({ label, field, placeholder, type }) => (
                  <div key={field}>
                    <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
                    {type === 'textarea'
                      ? <textarea value={fgForm[field]} onChange={e => setFgForm(f => ({ ...f, [field]: e.target.value }))} rows={2} placeholder={placeholder} className="input-field text-sm resize-none"/>
                      : <input type="text" value={fgForm[field]} onChange={e => setFgForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className="input-field text-sm"/>
                    }
                  </div>
                ))}
                {fgMsg.text && (
                  <div className={`text-sm p-3 rounded-xl ${fgMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {fgMsg.text}
                  </div>
                )}
                <button onClick={handleForeigner} disabled={fgLoad} className="btn-primary text-sm py-2.5 w-full">
                  {fgLoad ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Globe2 size={14}/> Register as Foreigner</>}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="card border border-white/5">
        <button onClick={() => setShowPwd(v => !v)} className="w-full flex items-center justify-between">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm">
            <Lock size={14} className="text-primary-400"/> Change Password
          </h3>
          <ChevronDown size={16} className={`text-gray-500 transition-transform ${showPwd ? 'rotate-180' : ''}`}/>
        </button>
        {showPwd && (
          <form onSubmit={changePwd} className="mt-4 space-y-3">
            {[
              { field: 'currentPassword', label: 'Current password' },
              { field: 'newPassword',     label: 'New password (min 6 chars)' },
              { field: 'confirmPassword', label: 'Confirm new password' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
                <input type="password" value={pwdForm[field]} onChange={e => setPwdForm(f => ({ ...f, [field]: e.target.value }))}
                  className="input-field text-sm" placeholder="••••••" required minLength={field === 'currentPassword' ? 1 : 6}/>
              </div>
            ))}
            {pwdMsg.text && (
              <div className={`text-sm p-3 rounded-xl ${pwdMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {pwdMsg.text}
              </div>
            )}
            <button type="submit" disabled={pwdSave} className="btn-primary text-sm py-2.5 px-5">
              {pwdSave ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
