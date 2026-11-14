import { apiErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useTelemetry } from '../data/api'

export function LiveTelemetry({ satelliteId }: { satelliteId: number }) {
  const query = useTelemetry(satelliteId)
  return <Card><CardHeader><CardTitle>Telemetria e alertas</CardTitle></CardHeader><CardContent className='space-y-3'>
    <p className='text-sm text-muted-foreground'>Sensores simulados pelo serviço orbital. As leituras e alertas são registrados no histórico do satélite.</p>
    {query.isLoading && <p>Consultando telemetria...</p>}
    {query.error && <p role='alert'>{apiErrorMessage(query.error)}</p>}
    <Button variant='outline' disabled={query.isFetching} onClick={() => query.refetch()}>Atualizar leitura</Button>
    {query.data && <><p className='text-sm'>{query.data.simulated ? 'Simulação' : 'Leitura'} · {new Date(query.data.timestamp).toLocaleString('pt-BR')}</p>
      <dl className='grid gap-3 sm:grid-cols-3'>{Object.entries(query.data.sensors).map(([name, reading]) => <div key={name} className='rounded border p-3'><dt className='text-xs text-muted-foreground'>{name}</dt><dd>{reading.value} {reading.unit} · {reading.status}</dd></div>)}</dl>
      {query.data.alerts.length === 0 ? <p>Nenhum alerta nesta leitura.</p> : <ul>{query.data.alerts.map((alert) => <li key={alert.code}>{alert.severity}: {alert.message}</li>)}</ul>}
    </>}
  </CardContent></Card>
}
