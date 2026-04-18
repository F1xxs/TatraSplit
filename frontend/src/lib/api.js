import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'

function getUserHandle() {
  return localStorage.getItem('tatrasplit_user_handle') || '@misha'
}

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  config.headers['X-User-Handle'] = getUserHandle()
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      'Request failed'
    return Promise.reject(new Error(msg))
  },
)
