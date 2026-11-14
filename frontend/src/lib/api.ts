import axios, { isAxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth-store'

// VITE_API_URL é a origem, sem /api; os serviços mantêm o prefixo Laravel.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '',
  timeout: 45000,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().auth.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 401 && !error.config?.url?.endsWith('/login')) {
    useAuthStore.getState().auth.reset()
    window.dispatchEvent(new Event('mission-control:unauthorized'))
  }
  return Promise.reject(error)
})

export function apiErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) return 'Não foi possível concluir a operação.'
  const status = error.response?.status
  const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
  if (status === 422) return Object.values(data?.errors ?? {}).flat().join(' ') || data?.message || 'Verifique os campos informados.'
  if (status === 401) return 'Sessão expirada ou credenciais inválidas. Entre novamente.'
  if (status === 403) return data?.message || 'Seu perfil não tem permissão para esta operação.'
  if (status === 404) return data?.message || 'Registro não encontrado. Atualize a lista.'
  if (status && status >= 500) return 'Serviço indisponível. Tente novamente em instantes.'
  return data?.message || 'Não foi possível conectar ao servidor.'
}
