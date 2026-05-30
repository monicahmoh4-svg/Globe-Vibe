import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tok = localStorage.getItem('gv_token')
    if (tok) {
      api.defaults.headers.common['Authorization'] = `Bearer ${tok}`
      api.get('/auth/me')
        .then(r => setUser(r.data.user))
        .catch(() => {
          localStorage.removeItem('gv_token')
          delete api.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('gv_token', data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async form => {
    const { data } = await api.post('/auth/register', form)
    localStorage.setItem('gv_token', data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('gv_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
    } catch {}
  }, [])

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
