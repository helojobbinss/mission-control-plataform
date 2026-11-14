import { api } from './api'
import { useAuthStore } from '@/stores/auth-store'

export type ApiUser = { id: number; name: string; email: string; role: string | null; is_active?: boolean }

export function storeUser(user: ApiUser) {
  useAuthStore.getState().auth.setUser({
    id: user.id, name: user.name, accountNo: String(user.id), email: user.email,
    role: user.role ? [user.role] : [], exp: 0,
  })
}

export async function login(credentials: { email: string; password: string }) {
  const { data } = await api.post<{ token: string; user: ApiUser }>('/api/login', credentials)
  useAuthStore.getState().auth.setAccessToken(data.token)
  storeUser(data.user)
  window.dispatchEvent(new Event('mission-control:authenticated'))
}

export async function loadSession() {
  const { data } = await api.get<{ user: ApiUser }>('/api/user')
  storeUser(data.user)
}

export function safeRedirect(path?: string) {
  return path?.startsWith('/') && !path.startsWith('//') && !path.includes('\\') ? path : '/'
}
