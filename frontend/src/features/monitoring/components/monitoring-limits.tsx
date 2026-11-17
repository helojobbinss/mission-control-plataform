import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'

type Limits = Record<string, Record<string, number | null>>
const parameters = [ ['internal_temperature', 'Temperatura interna', '°C'], ['battery_level', 'Bateria', '%'], ['voltage', 'Tensão', 'V'] ]
const bounds = [ ['critical_min', 'Crítico mínimo'], ['min', 'Mínimo'], ['max', 'Máximo'], ['critical_max', 'Crítico máximo'] ]

export function MonitoringLimits({ satelliteId }: { satelliteId: number }) {
  const [confirmation, setConfirmation] = useState('')
  const query = useQuery({ queryKey: ['monitoring-limits', satelliteId], queryFn: async ({ signal }) => (await api.get<Limits>(`/api/satellites/${satelliteId}/monitoring/limits`, { signal })).data, refetchOnWindowFocus: false })
  return <Card><CardHeader><CardTitle>Configurações de Monitoramento</CardTitle></CardHeader><CardContent>
    {query.isPending && <p>Carregando configurações…</p>}
    {query.isError && <p role='alert'>{apiErrorMessage(query.error)} <Button variant='outline' onClick={() => query.refetch()}>Tentar novamente</Button></p>}
    {query.data && <LimitsForm key={`${satelliteId}-${query.dataUpdatedAt}`} satelliteId={satelliteId} initial={query.data} onSaved={setConfirmation} />}
    {confirmation && <p role='status'>{confirmation}</p>}
  </CardContent></Card>
}

function LimitsForm({ satelliteId, initial, onSaved }: { satelliteId: number; initial: Limits; onSaved: (message: string) => void }) {
  const client = useQueryClient()
  const user = useAuthStore((state) => state.auth.user)
  const canEdit = user?.role.some((role) => ['gerente', 'operador'].includes(role)) ?? false
  const [values, setValues] = useState(() => Object.fromEntries(Object.entries(initial).map(([parameter, limits]) => [parameter, Object.fromEntries(Object.entries(limits).map(([key, value]) => [key, value === null ? '' : String(value)]))])))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    onSaved('')
    try {
      const limits = Object.fromEntries(Object.entries(values).map(([parameter, fields]) => [parameter, Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value === '' ? null : Number(value)]))]))
      const response = await api.put<Limits>(`/api/satellites/${satelliteId}/monitoring/limits`, { limits })
      client.setQueryData(['monitoring-limits', satelliteId], response.data)
      // A chave inclui o satélite original: uma resposta tardia nunca altera outro.
      await client.invalidateQueries({ queryKey: ['telemetry', satelliteId] })
      setFailed(false)
      onSaved('Configurações salvas. Os limites serão aplicados nas próximas leituras.')
    } catch (error) {
      setFailed(true)
      setMessage(apiErrorMessage(error))
    } finally { setBusy(false) }
  }
  return <form className='space-y-4' onSubmit={save}>
    <p className='text-sm text-muted-foreground'>Limites deste satélite para sensores simulados. Campos vazios desativam esse limite. Um nível é acionado apenas ao ultrapassar seu limite; crítico tem prioridade. Alterações não salvas são descartadas ao trocar de satélite.</p>
    {!canEdit && <p className='text-sm'>Somente gerente e operador podem alterar os limites.</p>}
    {parameters.map(([parameter, label, unit]) => <fieldset key={parameter} disabled={!canEdit || busy} className='rounded border p-3'>
      <legend className='px-1 font-medium'>{label} ({unit})</legend>
      <div className='grid gap-3 sm:grid-cols-4'>{bounds.map(([bound, title]) => <div key={bound} className='space-y-2'>
        <Label htmlFor={`${satelliteId}-${parameter}-${bound}`}>{title}</Label>
        <Input id={`${satelliteId}-${parameter}-${bound}`} type='number' step='any' min={parameter === 'battery_level' || parameter === 'voltage' ? 0 : -273.15} max={parameter === 'battery_level' ? 100 : 1000000} value={values[parameter][bound]} onChange={(e) => setValues((old) => ({ ...old, [parameter]: { ...old[parameter], [bound]: e.target.value } }))} />
      </div>)}</div>
    </fieldset>)}
    <Button type='submit' disabled={!canEdit || busy}>{busy ? 'Salvando…' : 'Salvar configurações'}</Button>
    {message && <p role={failed ? 'alert' : 'status'}>{message}</p>}
  </form>
}
