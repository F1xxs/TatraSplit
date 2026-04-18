import { handleMock } from '@/lib/mock'
import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'
const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

const axiosApi = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

axiosApi.interceptors.response.use(
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

async function runMock(method, url, data) {
  const result = await handleMock(method, url, data)
  return { data: result }
}

export const api = {
  get(url, config) {
    return useMock ? runMock('GET', url) : axiosApi.get(url, config)
  },
  post(url, data, config) {
    return useMock ? runMock('POST', url, data) : axiosApi.post(url, data, config)
  },
}