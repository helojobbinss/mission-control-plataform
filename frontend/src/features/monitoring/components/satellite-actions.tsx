import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { api, apiErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { type RegisteredSatellite } from '../data/api'

export function SatelliteActions({
  satellite,
}: {
  satellite: RegisteredSatellite
}) {
  const [mode, setMode] = useState<'edit' | 'delete' | null>(null)
  const client = useQueryClient()
  const role = useAuthStore((state) => state.auth.user?.role[0])
  const mutation = useMutation({
    mutationFn: async (payload: object | null) =>
      payload
        ? api.patch(`/api/satellites/${satellite.id}`, payload)
        : api.delete(`/api/satellites/${satellite.id}`),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['satellites'] })
      await client.invalidateQueries({
        queryKey: ['satellite-orbit', satellite.id],
      })
      await client.invalidateQueries({
        queryKey: ['manual-position', satellite.id],
      })
      setMode(null)
    },
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    mutation.mutate({
      name: values.get('name'),
      status: values.get('status'),
      ...(satellite.source === 'manual'
        ? {
            orbit: {
              altitude_km: Number(values.get('altitude')),
              inclination_deg: Number(values.get('inclination')),
            },
          }
        : {}),
    })
  }
  if (!['gerente', 'operador'].includes(role ?? '')) return null
  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        onClick={() => {
          mutation.reset()
          setMode('edit')
        }}
      >
        Editar satélite selecionado
      </Button>
      {role === 'gerente' && (
        <Button
          variant='destructive'
          onClick={() => {
            mutation.reset()
            setMode('delete')
          }}
        >
          Excluir satélite selecionado
        </Button>
      )}
      <Dialog
        open={mode !== null}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) setMode(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === 'edit' ? 'Editar satélite' : 'Excluir satélite'}
            </DialogTitle>
            <DialogDescription>
              {satellite.name} · ID interno {satellite.id} ·{' '}
              {satellite.norad_id
                ? `NORAD ${satellite.norad_id}`
                : 'Órbita manual simulada'}
            </DialogDescription>
          </DialogHeader>
          {mutation.error && (
            <p role='alert' className='text-destructive'>
              {apiErrorMessage(mutation.error)}
            </p>
          )}
          {mode === 'edit' ? (
            <form key={satellite.id} onSubmit={submit} className='space-y-3'>
              <label className='block'>
                Nome do satélite
                <Input
                  name='name'
                  required
                  maxLength={255}
                  defaultValue={satellite.name}
                />
              </label>
              <label className='block'>
                Estado do satélite
                <select
                  name='status'
                  defaultValue={satellite.status}
                  className='w-full rounded border p-2'
                >
                  <option value='active'>Ativo</option>
                  <option value='inactive'>Inativo</option>
                  <option value='decommissioned'>Desativado</option>
                </select>
              </label>
              {satellite.source === 'manual' && (
                <>
                  <label className='block'>
                    Altitude orbital (km)
                    <Input
                      name='altitude'
                      type='number'
                      min={160}
                      max={40000}
                      step='0.01'
                      defaultValue={satellite.orbit?.altitude_km}
                      required
                    />
                  </label>
                  <label className='block'>
                    Inclinação orbital (graus)
                    <Input
                      name='inclination'
                      type='number'
                      min={0}
                      max={180}
                      step='0.001'
                      defaultValue={satellite.orbit?.inclination_deg}
                      required
                    />
                  </label>
                </>
              )}
              <Button disabled={mutation.isPending}>Salvar satélite</Button>
            </form>
          ) : (
            <>
              <p>
                Excluir este cadastro e seu histórico de telemetria? Missões e
                ordens vinculadas impedem a exclusão.
              </p>
              <Button
                variant='destructive'
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(null)}
              >
                Confirmar exclusão do satélite
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
