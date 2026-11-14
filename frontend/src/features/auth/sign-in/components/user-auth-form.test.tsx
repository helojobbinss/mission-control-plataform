import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { UserAuthForm } from './user-auth-form'
const { navigate, login } = vi.hoisted(() => ({ navigate: vi.fn(), login: vi.fn() }))
vi.mock('@/lib/auth', async (original) => ({ ...await original(), login }))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => <a href={to} {...props}>{children}</a>,
}))
describe('Laravel login form', () => {
  beforeEach(() => { vi.clearAllMocks(); login.mockResolvedValue(undefined) })
  it('submits credentials and navigates after the login service succeeds', async () => {
    const screen = await render(<UserAuthForm redirectTo='/tasks' />)
    await userEvent.fill(screen.getByLabelText('Email', { exact: true }), 'manager@example.test')
    await userEvent.fill(screen.getByLabelText('Senha', { exact: true }), 'test-password')
    await userEvent.click(screen.getByRole('button', { name: 'Login', exact: true }))
    await vi.waitFor(() => expect(login).toHaveBeenCalledWith({ email: 'manager@example.test', password: 'test-password' }))
    expect(navigate).toHaveBeenCalledWith({ to: '/tasks', replace: true })
  })
  it('keeps the user on the login page after failure', async () => {
    login.mockRejectedValue(new Error('failed'))
    const screen = await render(<UserAuthForm />)
    await userEvent.fill(screen.getByLabelText('Email', { exact: true }), 'manager@example.test')
    await userEvent.fill(screen.getByLabelText('Senha', { exact: true }), 'test-password')
    await userEvent.click(screen.getByRole('button', { name: 'Login', exact: true }))
    await expect.element(screen.getByRole('alert')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })
})
