import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'

export function getUserHandle() {
  return localStorage.getItem('hacksplit_user_handle') || ''
}

export function setUserHandle(handle) {
  localStorage.setItem('hacksplit_user_handle', handle)
}

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const handle = getUserHandle()
  if (handle) config.headers['X-User-Handle'] = handle
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
