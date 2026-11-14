import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { ForgotPasswordForm } from './forgot-password-form'
const { post } = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('@/lib/api', () => ({ api: { post }, apiErrorMessage: () => 'Operação indisponível.' }))
describe('Development password recovery', () => {
  beforeEach(() => vi.clearAllMocks())
  it('shows the server development token', async () => {
    post.mockResolvedValue({ data: { token: 'development-token' } })
    const screen = await render(<ForgotPasswordForm />)
    await userEvent.fill(screen.getByLabelText('Email', { exact: true }), 'manager@example.test')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    await expect.element(screen.getByRole('status')).toHaveTextContent('development-token')
    expect(post).toHaveBeenCalledWith('/api/forgot-password', { email: 'manager@example.test' })
  })
  it('shows the failure without a token', async () => {
    post.mockRejectedValue(new Error('forbidden'))
    const screen = await render(<ForgotPasswordForm />)
    await userEvent.fill(screen.getByLabelText('Email', { exact: true }), 'manager@example.test')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Operação indisponível.')
  })
})
