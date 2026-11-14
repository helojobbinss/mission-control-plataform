import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api, apiErrorMessage } from '@/lib/api'
import { type ApiUser } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth-store'
import { Main } from '@/components/layout/main'
import { Header } from '@/components/layout/header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function UserManagement() {
  const user = useAuthStore((state) => state.auth.user)
  const [created, setCreated] = useState<ApiUser[]>([])
  const [message, setMessage] = useState('')
  const create = useMutation({
    mutationFn: async (payload: { name: string; email: string; password: string; password_confirmation: string; role_id: number }) => (await api.post<{ user: ApiUser }>('/api/users', payload)).data.user,
    onSuccess: (result) => { setCreated((items) => [...items, result]); setMessage('Usuário cadastrado.') },
  })
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    setMessage('')
    try {
      await create.mutateAsync({ name: String(fields.get('name')), email: String(fields.get('email')), password: String(fields.get('password')), password_confirmation: String(fields.get('password_confirmation')), role_id: Number(fields.get('role_id')) })
      form.reset()
    } catch { /* O erro fica visível no formulário. */ }
  }
  return <><Header><h1 className='me-auto font-semibold'>Gestão de usuários</h1><ProfileDropdown /></Header><Main className='space-y-5'>
    <Card><CardHeader><CardTitle>Seu acesso</CardTitle></CardHeader><CardContent>{user?.name} · {user?.email} · {user?.role.join(', ') || 'Sem perfil'}</CardContent></Card>
    <p className='text-sm text-muted-foreground'>O servidor permite cadastrar usuários por gerente. Listagem geral, edição, exclusão e convites ainda não estão disponíveis.</p>
    {user?.role.includes('gerente') ? <Card><CardHeader><CardTitle>Cadastrar usuário</CardTitle></CardHeader><CardContent>
      <form onSubmit={submit} className='grid max-w-lg gap-3'>
        <label>Nome<Input name='name' required maxLength={255} /></label>
        <label>E-mail<Input name='email' type='email' required maxLength={255} /></label>
        <label>Código do perfil<Input name='role_id' type='number' min={1} required /></label>
        <p className='text-xs text-muted-foreground'>Use o código de um perfil já cadastrado, informado pelo administrador. O servidor valida esse código; a consulta de perfis ainda não está disponível.</p>
        <label>Senha<Input name='password' type='password' minLength={8} autoComplete='new-password' required /></label>
        <label>Confirmação da senha<Input name='password_confirmation' type='password' minLength={8} autoComplete='new-password' required /></label>
        {create.error && <p role='alert' className='text-destructive'>{apiErrorMessage(create.error)}</p>}
        {message && <p role='status'>{message}</p>}
        <Button disabled={create.isPending}>{create.isPending ? 'Salvando...' : 'Cadastrar usuário'}</Button>
      </form>
    </CardContent></Card> : <p role='status'>Apenas gerentes podem cadastrar usuários.</p>}
    {created.length > 0 && <Card><CardHeader><CardTitle>Cadastrados nesta sessão</CardTitle></CardHeader><CardContent><ul>{created.map((item) => <li key={item.id}>{item.name} · {item.email} · {item.role}</li>)}</ul></CardContent></Card>}
  </Main></>
}
