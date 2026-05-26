import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Globe2, LayoutDashboard, Users, MessageCircle, Wallet, User, LogOut, Menu, X, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/browse',    icon: Users,           label: 'Browse'    },
  { to: '/chats',     icon: MessageCircle,   label: 'Chats'     },
  { to: '/wallet',    icon: Wallet,          label: 'Wallet'    },
  { to: '/profile',   icon: User,            label: 'Profile'   },
]

export default function AppLayout({ children }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const loc  = useLocation()
  const nav  = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden">
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 glass-strong border-r border-white/5 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-2.5 p-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Globe2 size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">GlobeVibe</span>
          <button onClick={() => setOpen(false)} className="lg:hidden ml-auto text-gray-500 hover:text-white"><X size={16} /></button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
              className={`nav-link ${loc.pathname === item.to ? 'active' : ''}`}>
              <item.icon size={17} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/3 mb-2">
            <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
              className="w-8 h-8 rounded-full flex-shrink-0 bg-dark-600" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-gray-500 truncate">{user?.country}</div>
            </div>
          </div>
          <button onClick={async () => { await logout(); nav('/') }}
            className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="glass-strong border-b border-white/5 px-4 h-14 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setOpen(true)} className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5">
            <Menu size={19} />
          </button>
          <span className="text-sm text-gray-500 font-medium hidden sm:block">{NAV.find(n=>n.to===loc.pathname)?.label || 'GlobeVibe'}</span>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="hidden sm:block">Online</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}
