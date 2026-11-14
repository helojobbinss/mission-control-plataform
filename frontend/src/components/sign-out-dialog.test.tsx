import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SignOutDialog } from './sign-out-dialog'
const { navigate, reset, post } = vi.hoisted(() => ({ navigate: vi.fn(), reset: vi.fn(), post: vi.fn() }))
vi.mock('@/stores/auth-store', () => ({ useAuthStore: () => ({ auth: { reset } }) }))
vi.mock('@/lib/api', () => ({ api: { post }, apiErrorMessage: () => 'Falha de conexão.' }))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate, useLocation: () => ({ href: '/tasks' }) }))
describe('Laravel logout', () => {
  beforeEach(() => { vi.clearAllMocks(); post.mockResolvedValue({}) })
  it('revokes the server token and clears the session and cache', async () => {
    const client = new QueryClient()
    client.setQueryData(['missions'], [{ id: 1 }])
    const screen = await render(<QueryClientProvider client={client}><SignOutDialog open onOpenChange={vi.fn()} /></QueryClientProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Sair', exact: true }))
    await vi.waitFor(() => expect(reset).toHaveBeenCalledOnce())
    expect(post).toHaveBeenCalledWith('/api/logout')
    expect(client.getQueryData(['missions'])).toBeUndefined()
    expect(navigate).toHaveBeenCalledWith({ to: '/sign-in', search: { redirect: '/tasks' }, replace: true })
  })
  it('does not revoke the token when cancelled', async () => {
    const screen = await render(<QueryClientProvider client={new QueryClient()}><SignOutDialog open onOpenChange={vi.fn()} /></QueryClientProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar', exact: true }))
    expect(post).not.toHaveBeenCalled()
    expect(reset).not.toHaveBeenCalled()
  })
})
