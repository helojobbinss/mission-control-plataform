import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { api, apiErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function DataExports() {
  const [dataset, setDataset] = useState('missions')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [satellite, setSatellite] = useState('')
  const [mission, setMission] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)

  async function download(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setFailed(false)
    try {
      const response = await api.get<Blob>('/api/exports', {
        responseType: 'blob',
        params: {
          dataset, start_date: start || undefined, end_date: end || undefined,
          satellite_id: satellite || undefined,
          mission_id: dataset === 'telemetry' ? undefined : mission || undefined,
        },
      })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `export-${dataset}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage('CSV gerado. Confira os downloads do navegador.')
    } catch (error) {
      setFailed(true)
      let detail = apiErrorMessage(error)
      if (isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
          const body = JSON.parse(await error.response.data.text()) as { message?: string; errors?: Record<string, string[]> }
          detail = Object.values(body.errors ?? {}).flat().join(' ') || body.message || detail
        } catch { /* Mantém a mensagem de erro HTTP quando a resposta não for JSON. */ }
      }
      setMessage(detail)
    } finally {
      setBusy(false)
    }
  }

  return <>
    <Header><div className='ms-auto flex items-center gap-4'><ThemeSwitch /><ProfileDropdown /></div></Header>
    <Main>
      <h1 className='text-2xl font-bold tracking-tight'>Extrair dados</h1>
      <p className='mt-2 text-muted-foreground'>Exporte registros armazenados para análise em Excel, Python ou outras ferramentas.</p>
      <Card className='mt-6 max-w-2xl'>
        <CardHeader><CardTitle>Exportação CSV</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={download} className='space-y-5'>
            <div className='space-y-2'><Label htmlFor='export-dataset'>Conjunto de dados</Label>
              <Select value={dataset} onValueChange={(value) => { setDataset(value); setMessage('') }}>
                <SelectTrigger id='export-dataset'><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value='missions'>Missões cadastradas</SelectItem><SelectItem value='satellites'>Satélites cadastrados</SelectItem><SelectItem value='telemetry'>Histórico de telemetria</SelectItem></SelectContent>
              </Select>
            </div>
            <p className='text-sm text-muted-foreground'>{dataset === 'telemetry'
              ? 'Datas em UTC da leitura registrada. Uma linha por sensor, com valor, unidade e indicação de simulação. A exportação não gera novas leituras.'
              : 'Datas em UTC de criação do cadastro. Deixe os filtros vazios para exportar todos os registros.'}</p>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'><Label htmlFor='export-start'>Data inicial</Label><Input id='export-start' type='date' value={start} onChange={(e) => setStart(e.target.value)} /></div>
              <div className='space-y-2'><Label htmlFor='export-end'>Data final (inclusive)</Label><Input id='export-end' type='date' min={start || undefined} value={end} onChange={(e) => setEnd(e.target.value)} /></div>
              <div className='space-y-2'><Label htmlFor='export-satellite'>ID do satélite (opcional)</Label><Input id='export-satellite' type='number' min='1' step='1' value={satellite} onChange={(e) => setSatellite(e.target.value)} /></div>
              {dataset !== 'telemetry' && <div className='space-y-2'><Label htmlFor='export-mission'>ID da missão (opcional)</Label><Input id='export-mission' type='number' min='1' step='1' value={mission} onChange={(e) => setMission(e.target.value)} /></div>}
            </div>
            {dataset === 'telemetry' && <p className='text-sm text-muted-foreground'>O histórico está vinculado ao satélite, sem vínculo direto com uma missão. Sensores simulados permanecem identificados pela coluna simulated.</p>}
            <Button type='submit' disabled={busy}>{busy ? 'Exportando…' : 'Exportar CSV'}</Button>
            {message && <p role={failed ? 'alert' : 'status'} className={failed ? 'text-sm text-destructive' : 'text-sm'}>{message}</p>}
          </form>
        </CardContent>
      </Card>
    </Main>
  </>
}
