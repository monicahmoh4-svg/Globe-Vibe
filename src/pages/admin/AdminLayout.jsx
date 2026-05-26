import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Shield, LayoutDashboard, Users, CreditCard, Download, MessageSquare, AlertTriangle, Settings, LogOut, Menu, X, Globe2 } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'

const NAV = [
  { to:'/admin/dashboard',   icon:LayoutDashboard, label:'Dashboard'    },
  { to:'/admin/users',       icon:Users,           label:'Users'        },
  { to:'/admin/transactions',icon:CreditCard,      label:'Transactions' },
  { to:'/admin/withdrawals', icon:Download,        label:'Withdrawals'  },
  { to:'/admin/connections', icon:MessageSquare,   label:'Connections'  },
  { to:'/admin/reports',     icon:AlertTriangle,   label:'Reports'      },
  { to:'/admin/settings',    icon:Settings,        label:'Settings'     },
]

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false)
  const { adminLogout } = useAdminAuth()
  const loc = useLocation()
  const nav = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={()=>setOpen(false)}/>}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-dark-900 border-r border-red-900/20 flex flex-col transition-transform duration-300 ${open?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-red-900/20">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-900/30">
            <Shield size={14} className="text-white"/>
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm">GlobeVibe</div>
            <div className="text-xs text-red-400 font-medium">Admin Panel</div>
          </div>
          <button onClick={()=>setOpen(false)} className="lg:hidden ml-auto text-gray-500 hover:text-white"><X size={15}/></button>
        </div>

        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {NAV.map(item=>(
            <Link key={item.to} to={item.to} onClick={()=>setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 font-medium
                ${loc.pathname===item.to?'text-white bg-red-600/20 border border-red-500/20':'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon size={15}/>{item.label}
            </Link>
          ))}
        </nav>

        <div className="p-2.5 border-t border-red-900/20">
          <button onClick={()=>{adminLogout();nav('/admin')}}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-all font-medium">
            <LogOut size={15}/>Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-dark-900 border-b border-red-900/20 px-4 h-12 flex items-center gap-3">
          <button onClick={()=>setOpen(true)} className="lg:hidden text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5"><Menu size={17}/></button>
          <div className="flex items-center gap-2 text-sm"><Shield size={13} className="text-red-400"/><span className="text-gray-400 font-medium text-xs">Admin Control Panel</span></div>
          <Link to="/" className="ml-auto text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1"><Globe2 size={11}/>View Site</Link>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}
