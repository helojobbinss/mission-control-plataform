import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { api, apiErrorMessage } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { auth } = useAuthStore()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(false)

  const handleSignOut = async () => {
    setPending(true)
    try { await api.post('/api/logout') } catch (error) {
      toast.error(`${apiErrorMessage(error)} O token pode continuar ativo no servidor.`)
    }
    auth.reset()
    queryClient.clear()
    setPending(false)
    // Preserve current location for redirect after sign-in
    const currentPath = location.href
    navigate({
      to: '/sign-in',
      search: { redirect: currentPath },
      replace: true,
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sair'
      desc='Tem certeza de que deseja sair da sua conta? Você precisará fazer login novamente para acessar sua conta.'
      confirmText='Sair'
      destructive
      isLoading={pending}
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
