import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const Ctx = createContext(null)
export const adminApi = axios.create({ baseURL: '/api' })

export function AdminAuthProvider({ children }) {
  const [admin,   setAdmin]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tok = localStorage.getItem('gv_admin_token')
    if (tok) {
      adminApi.defaults.headers.common['Authorization'] = `Bearer ${tok}`
      adminApi.get('/admin/stats')
        .then(() => setAdmin({ token: tok }))
        .catch(() => {
          localStorage.removeItem('gv_admin_token')
          delete adminApi.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const adminLogin = async (username, password) => {
    const { data } = await adminApi.post('/admin/login', { username, password })
    localStorage.setItem('gv_admin_token', data.token)
    adminApi.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setAdmin(data.admin)
    return data.admin
  }

  const adminLogout = () => {
    localStorage.removeItem('gv_admin_token')
    delete adminApi.defaults.headers.common['Authorization']
    setAdmin(null)
  }

  return (
    <Ctx.Provider value={{ admin, loading, adminLogin, adminLogout }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAdminAuth = () => useContext(Ctx)
