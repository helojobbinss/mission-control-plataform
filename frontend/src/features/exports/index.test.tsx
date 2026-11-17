import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { AxiosError } from 'axios'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { DataExports } from './index'

vi.mock('@/components/layout/header', () => ({ Header: ({ children }: { children: React.ReactNode }) => <header>{children}</header> }))
vi.mock('@/components/layout/main', () => ({ Main: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }))
vi.mock('@/components/profile-dropdown', () => ({ ProfileDropdown: () => null }))
vi.mock('@/components/theme-switch', () => ({ ThemeSwitch: () => null }))

const originalAdapter = api.defaults.adapter

describe('US01 export form', () => {
  beforeEach(() => useAuthStore.getState().auth.setAccessToken('export-test-token'))
  afterEach(() => {
    api.defaults.adapter = originalAdapter
    useAuthStore.getState().auth.reset()
    vi.restoreAllMocks()
  })

  it('downloads the backend CSV with filters and the existing Bearer token', async () => {
    const clicked = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const request = vi.fn()
    api.defaults.adapter = async (config) => {
      request(config)
      return { config, status: 200, statusText: 'OK', headers: {}, data: new Blob(['\ufeffid,name\r\n1,Missão\r\n'], { type: 'text/csv' }) }
    }
    const screen = await render(<DataExports />)
    await userEvent.fill(screen.getByLabelText('ID do satélite (opcional)'), '2')
    await userEvent.fill(screen.getByLabelText('ID da missão (opcional)'), '3')
    await userEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }))
    await expect.element(screen.getByRole('status')).toHaveTextContent('CSV gerado')
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/exports', responseType: 'blob',
      params: expect.objectContaining({ dataset: 'missions', satellite_id: '2', mission_id: '3' }),
    }))
    expect(request.mock.calls[0][0].headers.Authorization).toBe('Bearer export-test-token')
    expect(clicked).toHaveBeenCalledOnce()
  })

  it.each([
    [404, { message: 'Nenhum registro encontrado para os filtros informados.' }, 'Nenhum registro encontrado'],
    [422, { errors: { end_date: ['Intervalo de datas inválido.'] } }, 'Intervalo de datas inválido.'],
    [500, {}, 'Serviço indisponível'],
  ])('shows the backend blob error for HTTP %s', async (status, body, message) => {
    api.defaults.adapter = async (config) => {
      throw new AxiosError('failed', undefined, config, undefined, {
        config, status, statusText: 'Error', headers: {}, data: new Blob([JSON.stringify(body)], { type: 'application/json' }),
      })
    }
    const screen = await render(<DataExports />)
    await userEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }))
    await expect.element(screen.getByRole('alert')).toHaveTextContent(message)
    await expect.element(screen.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled()
  })

  it('omits the unsupported mission filter when exporting telemetry', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const request = vi.fn()
    api.defaults.adapter = async (config) => {
      request(config)
      return { config, status: 200, statusText: 'OK', headers: {}, data: new Blob(['csv']) }
    }
    const screen = await render(<DataExports />)
    await userEvent.fill(screen.getByLabelText('ID da missão (opcional)'), '3')
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByRole('option', { name: 'Histórico de telemetria' }))
    await expect.element(screen.getByLabelText('ID da missão (opcional)')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }))
    await expect.element(screen.getByRole('status')).toHaveTextContent('CSV gerado')
    expect(request.mock.calls[0][0].params).toMatchObject({ dataset: 'telemetry', mission_id: undefined })
  })
})
