import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth }           from './context/AuthContext'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'

import Landing    from './pages/Landing'
import Login      from './pages/auth/Login'
import Register   from './pages/auth/Register'

import AppLayout  from './components/layout/AppLayout'
import Dashboard  from './pages/dashboard/Dashboard'
import Browse     from './pages/dashboard/Browse'
import Chats      from './pages/dashboard/Chats'
import ChatPage   from './pages/dashboard/ChatPage'
import WalletPage from './pages/dashboard/Wallet'
import Profile    from './pages/dashboard/Profile'

import AdminLogin      from './pages/admin/AdminLogin'
import AdminLayout     from './pages/admin/AdminLayout'
import AdminDashboard  from './pages/admin/AdminDashboard'
import AdminUsers      from './pages/admin/AdminUsers'
import { AdminTransactions, AdminWithdrawals, AdminReports, AdminConnections, AdminSettings } from './pages/admin/AdminOtherPages'

function Loader({ color = 'primary' }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className={`w-8 h-8 border-2 border-${color}-500/30 border-t-${color}-500 rounded-full animate-spin`} />
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AdminRoute({ children }) {
  const { admin, loading } = useAdminAuth()
  if (loading) return <Loader color="red" />
  return admin ? children : <Navigate to="/admin" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<Landing />} />
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* User app */}
            <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
            <Route path="/browse"    element={<PrivateRoute><AppLayout><Browse /></AppLayout></PrivateRoute>} />
            <Route path="/chats"     element={<PrivateRoute><AppLayout><Chats /></AppLayout></PrivateRoute>} />
            <Route path="/chat/:id"  element={<PrivateRoute><AppLayout><ChatPage /></AppLayout></PrivateRoute>} />
            <Route path="/wallet"    element={<PrivateRoute><AppLayout><WalletPage /></AppLayout></PrivateRoute>} />
            <Route path="/profile"   element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />

            {/* Admin */}
            <Route path="/admin"                element={<AdminLogin />} />
            <Route path="/admin/dashboard"      element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
            <Route path="/admin/users"          element={<AdminRoute><AdminLayout><AdminUsers /></AdminLayout></AdminRoute>} />
            <Route path="/admin/transactions"   element={<AdminRoute><AdminLayout><AdminTransactions /></AdminLayout></AdminRoute>} />
            <Route path="/admin/withdrawals"    element={<AdminRoute><AdminLayout><AdminWithdrawals /></AdminLayout></AdminRoute>} />
            <Route path="/admin/connections"    element={<AdminRoute><AdminLayout><AdminConnections /></AdminLayout></AdminRoute>} />
            <Route path="/admin/reports"        element={<AdminRoute><AdminLayout><AdminReports /></AdminLayout></AdminRoute>} />
            <Route path="/admin/settings"       element={<AdminRoute><AdminLayout><AdminSettings /></AdminLayout></AdminRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  )
}
