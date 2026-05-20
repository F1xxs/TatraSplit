import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

export const API_BASE =
  (import.meta as any).env.VITE_API_BASE || "http://localhost:8000/api/v1";

export function getUserHandle(): string {
  return localStorage.getItem("hacksplit_user_handle") || "";
}

export function setUserHandle(handle: string): void {
  localStorage.setItem("hacksplit_user_handle", handle);
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const handle = getUserHandle();
  if (handle) config.headers["X-User-Handle"] = handle;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Request failed";
    return Promise.reject(new Error(msg));
  },
);
