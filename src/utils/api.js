import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 30000 })

const tok = localStorage.getItem('gv_token')
if (tok) api.defaults.headers.common['Authorization'] = `Bearer ${tok}`

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gv_token')
      delete api.defaults.headers.common['Authorization']
      if (!window.location.pathname.includes('/login') &&
          !window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
