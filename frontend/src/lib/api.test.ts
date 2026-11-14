import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { api, apiErrorMessage } from './api'
import { login, loadSession, safeRedirect } from './auth'
import { useAuthStore } from '@/stores/auth-store'
import { listSatellites } from '@/features/monitoring/data/api'
import { listMissions, saveMission, transitionMission } from '@/features/tasks/data/api'

const originalAdapter = api.defaults.adapter
function response(config: InternalAxiosRequestConfig, data: unknown) {
  return { config, data, status: 200, statusText: 'OK', headers: {} }
}
describe('Laravel API contracts', () => {
  beforeEach(() => useAuthStore.getState().auth.reset())
  afterEach(() => { api.defaults.adapter = originalAdapter; useAuthStore.getState().auth.reset() })
  it('reads every satellite page and sends the current Bearer token', async () => {
    const pages: number[] = []
    useAuthStore.getState().auth.setAccessToken('test-token')
    api.defaults.adapter = async (config) => {
      expect(config.headers.Authorization).toBe('Bearer test-token')
      pages.push(config.params.page)
      return response(config, { data: [{ id: config.params.page }], last_page: 2 })
    }
    expect((await listSatellites()).map((item) => item.id)).toEqual([1, 2])
    expect(pages).toEqual([1, 2])
  })
  it('uses the login and user envelopes and restores the real role', async () => {
    const user = { id: 12, name: 'Operator', email: 'operator@example.test', role: 'operador' }
    api.defaults.adapter = async (config) => response(config, config.url === '/api/login' ? { token: 'server-token', user } : { user })
    await login({ email: user.email, password: 'test-password' })
    expect(useAuthStore.getState().auth.accessToken).toBe('server-token')
    useAuthStore.getState().auth.setUser(null)
    await loadSession()
    expect(useAuthStore.getState().auth.user).toMatchObject({ id: 12, name: 'Operator', role: ['operador'] })
  })
  it('maps the mission array and preserves save and transition payloads', async () => {
    const requests: { url: string | undefined; payload: unknown }[] = []
    api.defaults.adapter = async (config) => {
      requests.push({ url: config.url, payload: config.data ? JSON.parse(config.data) : null })
      return response(config, config.method === 'get' ? [{ id: 4, satellite_id: 9, satellite: { name: 'Manual' }, name: 'Mission', status: 'Agendada', budget: '20.00' }] : {})
    }
    expect(await listMissions()).toEqual([expect.objectContaining({ id: '4', title: 'Mission', satellite_name: 'Manual', budget: '20.00' })])
    await saveMission({ title: 'Mission', satellite_id: '9', status: 'Agendada', label: 'Monitoramento', Operador: 'Operator', budget: '20,00' }, '4')
    await transitionMission('4', 'start')
    expect(requests[1]).toMatchObject({ url: '/api/missions/4', payload: { name: 'Mission', satellite_id: 9, budget: '20.00' } })
    expect(requests[2]).toEqual({ url: '/api/missions/4/transition', payload: { action: 'start' } })
  })
  it.each([401, 403, 404, 422, 500])('handles HTTP %s without silently succeeding', async (status) => {
    useAuthStore.getState().auth.setAccessToken('server-token')
    const expired = vi.fn()
    window.addEventListener('mission-control:unauthorized', expired)
    api.defaults.adapter = async (config) => {
      throw new AxiosError('failed', 'ERR_BAD_RESPONSE', config, undefined, { ...response(config, { errors: { name: ['Nome obrigatório.'] } }), status })
    }
    try {
      await api.get('/api/missions')
      throw new Error('Expected API failure')
    } catch (error) {
      expect(error).toBeInstanceOf(AxiosError)
      expect(apiErrorMessage(error)).not.toBe('')
      if (status === 422) expect(apiErrorMessage(error)).toBe('Nome obrigatório.')
      expect(useAuthStore.getState().auth.accessToken).toBe(status === 401 ? '' : 'server-token')
      expect(expired).toHaveBeenCalledTimes(status === 401 ? 1 : 0)
    } finally { window.removeEventListener('mission-control:unauthorized', expired) }
  })
  it('rejects redirects to external origins', () => {
    expect(safeRedirect('https://example.test')).toBe('/')
    expect(safeRedirect('//example.test')).toBe('/')
    expect(safeRedirect('/tasks')).toBe('/tasks')
  })
})
