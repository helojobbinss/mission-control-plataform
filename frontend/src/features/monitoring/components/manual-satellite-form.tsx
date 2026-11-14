import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ManualSatelliteForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [altitude, setAltitude] = useState('500')
  const [inclination, setInclination] = useState('30')
  const client = useQueryClient()
  const role = useAuthStore((state) => state.auth.user?.role[0])
  const add = useMutation({
    mutationFn: () => api.post('/api/satellites', { source: 'manual', name, orbit: { altitude_km: Number(altitude), inclination_deg: Number(inclination) } }),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['satellites'] }); toast.success('Satélite manual cadastrado.'); setName(''); onSuccess() },
  })
  function submit(event: FormEvent) { event.preventDefault(); if (!add.isPending) add.mutate() }
  if (!['gerente', 'operador'].includes(role ?? '')) return <p className='text-sm text-muted-foreground'>Cadastro manual disponível para gerentes e operadores.</p>
  return <form onSubmit={submit} className='space-y-3 border-t pt-4'>
    <h3 className='font-semibold'>Cadastrar satélite manual</h3>
    <p className='text-sm text-muted-foreground'>Órbita circular simulada. Não exige catálogo externo.</p>
    <label className='block text-sm'>Nome<Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} /></label>
    <label className='block text-sm'>Altitude (km)<Input type='number' min={160} max={40000} step='0.01' value={altitude} onChange={(e) => setAltitude(e.target.value)} required /></label>
    <label className='block text-sm'>Inclinação (graus)<Input type='number' min={0} max={180} step='0.001' value={inclination} onChange={(e) => setInclination(e.target.value)} required /></label>
    {add.error && <p role='alert' className='text-sm text-destructive'>{apiErrorMessage(add.error)}</p>}
    <Button disabled={add.isPending}>{add.isPending ? 'Salvando...' : 'Cadastrar manual'}</Button>
  </form>
}
