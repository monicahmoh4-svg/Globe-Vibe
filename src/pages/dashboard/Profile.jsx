import { useState } from 'react'
import { User, Globe2, MessageCircle, Star, Edit3, Save, X, Lock, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { flag, fmtKES, fmtDate } from '../../utils/helpers'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({ name: user?.name||'', bio: user?.bio||'', language: user?.language||'' })
  const [pwdForm, setPwdForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' })
  const [saving,  setSaving]  = useState(false)
  const [pwdSave, setPwdSave] = useState(false)
  const [msg,     setMsg]     = useState('')
  const [pwdMsg,  setPwdMsg]  = useState({ type:'', text:'' })
  const [showPwd, setShowPwd] = useState(false)

  if (!user) return null

  const saveProfile = async () => {
    setSaving(true); setMsg('')
    try {
      await api.put('/users/profile/update', form)
      await refreshUser()
      setEditing(false); setMsg('Profile updated!')
      setTimeout(()=>setMsg(''), 3000)
    } catch(e) { setMsg(e.response?.data?.error||'Failed to save') }
    finally { setSaving(false) }
  }

  const changePwd = async e => {
    e.preventDefault()
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { setPwdMsg({type:'error',text:"Passwords don't match"}); return }
    setPwdSave(true)
    try {
      await api.put('/users/profile/password', { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword })
      setPwdMsg({ type:'success', text:'Password changed!' })
      setPwdForm({ currentPassword:'', newPassword:'', confirmPassword:'' })
    } catch(e) { setPwdMsg({ type:'error', text: e.response?.data?.error||'Failed' }) }
    finally { setPwdSave(false) }
  }

  return (
    <div className="p-5 max-w-xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-sub">Manage your account information</p>
      </div>

      {msg && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 text-green-400 text-sm">{msg}</div>}

      {/* Avatar + info */}
      <div className="card border border-white/5 mb-4">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              className="w-18 h-18 rounded-2xl bg-dark-600 w-[72px] h-[72px]"/>
            {user.is_online && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-dark-800 animate-pulse"/>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="font-display text-lg font-bold text-white">{user.name}</h2>
              {user.is_verified  && <span className="badge badge-green">✓ Verified</span>}
              {user.is_foreigner && <span className="badge badge-purple">Foreigner</span>}
            </div>
            <p className="text-gray-400 text-sm mb-2">{user.email}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <span>{flag(user.country_code)} {user.country}</span>
              <span className="flex items-center gap-1"><MessageCircle size={11}/> {user.total_chats} chats</span>
              {user.is_foreigner && <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400"/> {Number(user.rating).toFixed(1)}</span>}
              <span>Joined {fmtDate(user.created_at)}</span>
            </div>
          </div>
          <button onClick={()=>{ if(editing){setEditing(false)}else{setEditing(true);setForm({name:user.name||'',bio:user.bio||'',language:user.language||''})} }}
            className={editing?'btn-ghost text-red-400 hover:text-red-300 text-sm':'btn-secondary text-sm py-2 px-4'}>
            {editing ? <><X size={13}/>Cancel</> : <><Edit3 size={13}/>Edit</>}
          </button>
        </div>
      </div>

      {/* Edit form */}
      <div className="card border border-white/5 mb-4">
        <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2 text-sm"><User size={14} className="text-primary-400"/>Profile Info</h3>
        <div className="space-y-3">
          {[
            {label:'Display name', field:'name', placeholder:'Your name'},
            {label:'Languages',    field:'language', placeholder:'e.g. English, Swahili'},
          ].map(({label,field,placeholder})=>(
            <div key={field}>
              <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
              <input value={editing ? form[field] : (user[field]||'')} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
                disabled={!editing} placeholder={placeholder}
                className="input-field text-sm disabled:opacity-50 disabled:cursor-not-allowed"/>
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Bio</label>
            <textarea value={editing ? form.bio : (user.bio||'')} onChange={e=>setForm(f=>({...f,bio:e.target.value}))}
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

      {/* Change password */}
      <div className="card border border-white/5">
        <button onClick={()=>setShowPwd(v=>!v)}
          className="w-full flex items-center justify-between">
          <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm"><Lock size={14} className="text-primary-400"/>Change Password</h3>
          <ChevronDown size={16} className={`text-gray-500 transition-transform ${showPwd?'rotate-180':''}`}/>
        </button>
        {showPwd && (
          <form onSubmit={changePwd} className="mt-4 space-y-3">
            {[
              {field:'currentPassword', label:'Current password'},
              {field:'newPassword',     label:'New password'},
              {field:'confirmPassword', label:'Confirm new password'},
            ].map(({field,label})=>(
              <div key={field}>
                <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
                <input type="password" value={pwdForm[field]} onChange={e=>setPwdForm(f=>({...f,[field]:e.target.value}))}
                  className="input-field text-sm" placeholder="••••••" required minLength={field==='currentPassword'?1:6}/>
              </div>
            ))}
            {pwdMsg.text && (
              <div className={`text-sm p-3 rounded-xl ${pwdMsg.type==='success'?'bg-green-500/10 text-green-400 border border-green-500/20':'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
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
