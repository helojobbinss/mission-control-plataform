import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { MonitoringLimits } from './monitoring-limits'

const originalAdapter = api.defaults.adapter
const defaults = (max = 40) => ({ internal_temperature: { min: null, max, critical_min: null, critical_max: null }, battery_level: { min: 20, max: null, critical_min: null, critical_max: null }, voltage: { min: 25, max: 31, critical_min: null, critical_max: null } })
let client: QueryClient
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  useAuthStore.getState().auth.setUser({ id: 1, name: 'Test', accountNo: 'test', email: 'test@example.test', role: ['operador'], exp: 0 })
})
afterEach(() => { api.defaults.adapter = originalAdapter; client.clear(); useAuthStore.getState().auth.reset() })
const view = (id: number) => <QueryClientProvider client={client}><MonitoringLimits key={id} satelliteId={id} /></QueryClientProvider>

describe('US11 validation', () => {
  it('updates the per-satellite query cache after saving', async () => {
    api.defaults.adapter = async (config) => ({ config, headers: {}, status: 200, statusText: 'OK', data: config.method === 'put' ? defaults(75) : defaults() })
    const screen = await render(view(1))
    const max = screen.getByRole('group', { name: 'Temperatura interna (°C)' }).getByLabelText('Máximo', { exact: true })
    await userEvent.fill(max, '75')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar configurações' }))
    await expect.element(screen.getByRole('status')).toHaveTextContent('Configurações salvas')
    expect(client.getQueryData(['monitoring-limits', 1])).toEqual(defaults(75))
  })
  it('reports a failed save and does not mark edited values as persisted', async () => {
    api.defaults.adapter = async (config) => {
      if (config.method === 'put') throw new AxiosError('offline')
      return { config, headers: {}, status: 200, statusText: 'OK', data: defaults() }
    }
    const screen = await render(view(1))
    await userEvent.fill(screen.getByRole('group', { name: 'Temperatura interna (°C)' }).getByLabelText('Máximo', { exact: true }), '75')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar configurações' }))
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Não foi possível conectar')
    expect(client.getQueryData(['monitoring-limits', 1])).toEqual(defaults())
    await expect.element(screen.getByRole('status')).not.toBeInTheDocument()
  })
  it('reports a failed load and supports retry', async () => {
    let fail = true
    api.defaults.adapter = async (config) => {
      if (fail) throw new AxiosError('offline')
      return { config, headers: {}, status: 200, statusText: 'OK', data: defaults() }
    }
    const screen = await render(view(1))
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Não foi possível conectar')
    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await expect.element(screen.getByRole('group', { name: 'Temperatura interna (°C)' })).toBeInTheDocument()
  })
  it('discards unsaved edits when switching satellites', async () => {
    api.defaults.adapter = async (config) => ({ config, headers: {}, status: 200, statusText: 'OK', data: defaults(config.url?.includes('/2/') ? 80 : 40) })
    const screen = await render(view(1))
    const maximum = () => screen.getByRole('group', { name: 'Temperatura interna (°C)' }).getByLabelText('Máximo', { exact: true })
    await userEvent.fill(maximum(), '65')
    await screen.rerender(view(2))
    await expect.element(maximum()).toHaveValue(80)
    await screen.rerender(view(1))
    await expect.element(maximum()).toHaveValue(40)
  })
})
