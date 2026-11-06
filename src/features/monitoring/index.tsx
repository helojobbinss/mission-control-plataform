import { useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { json2satrec, propagate, gstime, eciToGeodetic, degreesLat, degreesLong, type OMMJsonObject } from 'satellite.js'
import { Activity, BatteryMedium, ChevronDown, ChevronUp, Clock3, Gauge, Orbit, Plus, Radio, Satellite as SatelliteIcon, Thermometer } from 'lucide-react'
import { useMissionClock, formatLive } from '@/hooks/use-mission-clock'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { AddSatellite } from './components/add-satellite'
import { OrbitView } from './components/orbit-view'
import { satellites as decorativeSatellites } from './data/fleet'

type RegisteredSatellite = { id: number; name: string; norad_id: number; missions: { id: number; name: string; status: string }[] }
type OrbitData = { source: string; retrieved_at: string; elements: OMMJsonObject }
type ReceptionData = {
  source: string
  license: string
  checked_at: string
  signal: { state: string; label: string; strength_dbm: number | null; snr_db: number | null }
  observation: null | { id: number; start: string; end: string | null; status: string | null; waterfall_status: string | null; station_name: string | null; frequency_hz: number | null; mode: string | null; url: string | null }
}

function calculate(elements: OMMJsonObject, date: Date) {
  try {
    const state = propagate(json2satrec(elements), date)
    if (!state) return null
    const location = eciToGeodetic(state.position, gstime(date))
    const velocity = Math.hypot(state.velocity.x, state.velocity.y, state.velocity.z)
    const values = [degreesLat(location.latitude), degreesLong(location.longitude), location.height, velocity]
    if (!values.every(Number.isFinite)) return null
    return { latitude: values[0], longitude: values[1], altitude: values[2], velocity: values[3] }
  } catch { return null }
}

function formatAge(timestamp: string | undefined, now: Date) {
  if (!timestamp) return null
  const date = new Date(timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`)
  if (!Number.isFinite(date.getTime())) return null
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60_000))
  if (minutes < 1) return { label: 'agora', minutes: 0 }
  if (minutes < 60) return { label: `há ${minutes} min`, minutes }
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return { label: `há ${hours} h`, minutes }
  const days = Math.floor(hours / 24)
  return { label: `há ${days} dias`, minutes }
}

function freshness(minutes: number | undefined) {
  if (minutes === undefined) return { label: 'Sem dados', classes: 'border-muted text-muted-foreground' }
  if (minutes < 24 * 60) return { label: 'Atual', classes: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' }
  if (minutes < 7 * 24 * 60) return { label: 'Atenção', classes: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300' }
  return { label: 'Desatualizado', classes: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300' }
}

export function Monitoring() {
  const [open, setOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { now } = useMissionClock(1000)
  const { data: satellites = [], isLoading, isError, refetch } = useQuery({ queryKey: ['satellites'], queryFn: async () => (await axios.get<RegisteredSatellite[]>('/api/satellites')).data })
  const selected = satellites.find((satellite) => satellite.id === selectedId) ?? satellites[0]
  const orbital = useQueries({ queries: satellites.map((satellite) => ({
    queryKey: ['satellite-orbit', satellite.id],
    queryFn: async ({ signal }: { signal: AbortSignal }) => (await axios.get<OrbitData>(`/api/satellites/${satellite.id}/orbit`, { signal })).data,
    staleTime: 60 * 60 * 1000, refetchInterval: 60 * 60 * 1000, retry: 1,
  })) })
  const receptions = useQueries({ queries: satellites.map((satellite) => ({
    queryKey: ['satellite-reception', satellite.id],
    queryFn: async ({ signal }: { signal: AbortSignal }) => (await axios.get<ReceptionData>(`/api/satellites/${satellite.id}/reception`, { signal })).data,
    staleTime: 10 * 60 * 1000, refetchInterval: 10 * 60 * 1000, retry: false,
  })) })
  const selectedIndex = satellites.findIndex((satellite) => satellite.id === selected?.id)
  const selectedOrbit = orbital[selectedIndex]
  const selectedReception = receptions[selectedIndex]
  const latestObservation = selectedReception?.data?.observation
  const observationAge = formatAge(latestObservation?.start, now)
  const receptionValue = selectedReception?.isLoading ? 'Consultando' : selectedReception?.isError ? 'Indisponível' : selectedReception?.data?.signal.label ?? 'Sem observações públicas'
  const receptionHint = selectedReception?.isError ? 'SatNOGS temporariamente indisponível' : latestObservation ? `${latestObservation.station_name ?? 'Estação pública'} · ${observationAge?.label ?? 'horário indisponível'}` : 'Fonte pública SatNOGS'
  const position = selectedOrbit?.data ? calculate(selectedOrbit.data.elements, now) : null
  const elements = selectedOrbit?.data?.elements
  const epoch = typeof elements?.EPOCH === 'string' ? formatAge(elements.EPOCH, now) : null
  const retrieved = formatAge(selectedOrbit?.data?.retrieved_at, now)
  const epochFreshness = freshness(epoch?.minutes)
  const globe = satellites.map((satellite, index) => ({ ...decorativeSatellites[index % decorativeSatellites.length], id: String(satellite.id), name: satellite.name }))
  const fmt = (value: number | undefined, digits = 2) => value === undefined || !Number.isFinite(value) ? '—' : value.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits })
  const meanMotion = Number(elements?.MEAN_MOTION)
  const periodMinutes = Number.isFinite(meanMotion) && meanMotion > 0 ? 1440 / meanMotion : undefined
  const eccentricity = Number(elements?.ECCENTRICITY)

  return <><Header><div className='ml-auto flex items-center gap-4'><ThemeSwitch /><ConfigDrawer /><ProfileDropdown /></div></Header><Main className='flex flex-1 flex-col gap-5'>
    <div className='flex flex-wrap items-center justify-between gap-4'><div><div className='mb-1 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400'><Activity className='size-4' /> Centro de monitoramento</div><h1 className='text-3xl font-bold tracking-tight'>Acompanhamento de satélites</h1><p className='mt-1 text-sm text-muted-foreground'>Frota, posição orbital calculada e condição dos dados em um só lugar.</p><p className='mt-2 font-mono text-xs text-muted-foreground'>RELÓGIO UTC · {formatLive(now)}</p></div></div>
    <div className='flex items-start gap-3 rounded-xl border border-sky-500/30 bg-sky-500/[0.06] p-4 text-sm'><Orbit className='mt-0.5 size-4 shrink-0 text-sky-500' /><p><span className='font-semibold'>Sobre estes dados:</span> a posição e a velocidade são calculadas com SGP4 a partir dos elementos orbitais do CelesTrak. A recepção vem de observações públicas do SatNOGS e não é contínua nem informa intensidade em dBm. Bateria e temperatura ainda não têm uma fonte conectada. O globo é ilustrativo.</p></div>
    {isLoading ? <Card><CardContent className='py-10 text-center text-muted-foreground'>Carregando satélites cadastrados...</CardContent></Card> : isError ? <Card><CardContent className='flex flex-wrap items-center justify-between gap-3 py-6 text-sm'>Não foi possível carregar a frota.<Button variant='outline' onClick={() => refetch()}>Tentar novamente</Button></CardContent></Card> : satellites.length === 0 ? <Card><CardContent className='py-10 text-center'><SatelliteIcon className='mx-auto mb-3 size-8 text-muted-foreground' /><p className='font-semibold'>Sua frota começa aqui</p><p className='mt-1 text-sm text-muted-foreground'>Adicione um satélite para acompanhar seus dados orbitais.</p></CardContent></Card> : <>
      <section aria-label='Resumo da frota' className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'><Metric icon={SatelliteIcon} label='Satélites cadastrados' value={String(satellites.length)} hint='Na sua frota' /><Metric icon={Radio} label='Sinal · última recepção' value={receptionValue} hint={receptionHint} /><Metric icon={BatteryMedium} label='Bateria' value='Indisponível' hint='Sem telemetria decodificada' /><Metric icon={Orbit} label='Posição orbital' value={selectedOrbit?.isLoading ? 'Carregando' : position ? 'Calculada' : 'Indisponível'} hint={selected?.name ?? 'Satélite selecionado'} /></section>
      <section className='grid items-stretch gap-4 lg:grid-cols-12' aria-label='Rastreamento orbital e frota'><Card className='h-full overflow-hidden lg:col-span-7'><CardHeader className='border-b bg-muted/20'><div className='flex items-center justify-between gap-3'><div><CardTitle>Rastreamento orbital <span className='text-xs font-normal text-muted-foreground'>· globo ilustrativo</span></CardTitle></div></div></CardHeader><CardContent className='flex min-h-[430px] items-center justify-center p-4'><div className='w-full max-w-[430px]'><OrbitView satellites={globe} selectedId={String(selected?.id)} onSelect={(id) => setSelectedId(Number(id))} /></div></CardContent></Card>
      <Card className='h-full lg:col-span-5'><CardHeader className='border-b bg-muted/20'><div className='flex flex-wrap items-center justify-between gap-2'><CardTitle>Frota</CardTitle><Button size='sm' onClick={() => setOpen(true)}><Plus className='size-4' /> Adicionar satélite</Button></div></CardHeader><CardContent className='max-h-[490px] space-y-2 overflow-y-auto p-4'>{satellites.map((satellite, index) => <button key={satellite.id} type='button' onClick={() => setSelectedId(satellite.id)} aria-pressed={satellite.id === selected?.id} className={`w-full rounded-xl border p-3 text-left transition-colors hover:bg-muted/40 ${satellite.id === selected?.id ? 'border-violet-500 bg-violet-500/[0.08] ring-1 ring-violet-500/20' : 'border-transparent bg-muted/20'}`}><span className='flex items-center justify-between gap-2'><span className='font-semibold'>{satellite.name}</span><span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${orbital[index]?.data ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300' : 'border-muted text-muted-foreground'}`}>{orbital[index]?.isLoading ? 'Consultando' : orbital[index]?.data ? 'Órbita disponível' : 'Órbita pendente'}</span></span><span className='mt-1 block text-xs text-muted-foreground'>NORAD {satellite.norad_id} · {satellite.missions.length} missão(ões) vinculada(s)</span></button>)}</CardContent></Card></section>
      {selected && <section aria-label='Detalhes do satélite selecionado' className='space-y-4'><Card className='overflow-hidden'><CardHeader className='border-b bg-gradient-to-r from-violet-500/[0.08] via-background to-sky-500/[0.06]'><div className='flex flex-wrap items-start justify-between gap-3'><div><div className='mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300'><SatelliteIcon className='size-3.5' /> Satélite selecionado</div><CardTitle className='text-2xl'>{selected.name}</CardTitle><p className='mt-1 text-sm text-muted-foreground'>Identificador NORAD {selected.norad_id}</p></div>{epochFreshness.label !== 'Sem dados' && <span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${epochFreshness.classes}`}>{epochFreshness.label} · época orbital</span>}</div></CardHeader>
        <CardContent className='p-6 md:p-8'><div className='ml-1 space-y-7 md:ml-3'><div><SectionHeading title='Missões vinculadas' subtitle='Operações relacionadas a este satélite' />{selected.missions.length === 0 ? <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>Nenhuma missão vinculada a este satélite.</div> : <div className='grid gap-2 sm:grid-cols-2'>{selected.missions.map((mission) => <div key={mission.id} className='flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3'><span className='font-medium'>{mission.name}</span><span className='shrink-0 rounded-full border border-violet-500/40 px-2.5 py-1 text-xs text-violet-700 dark:text-violet-300'>{mission.status}</span></div>)}</div>}</div>
          {selectedOrbit?.isLoading && <p className='text-sm text-muted-foreground'>Consultando os elementos orbitais do CelesTrak...</p>}{selectedOrbit?.isError && <div className='rounded-lg border border-amber-500/40 bg-amber-500/[0.06] p-3 text-sm'>Dados orbitais indisponíveis agora. <button type='button' className='font-medium underline' onClick={() => selectedOrbit.refetch()}>Tentar novamente</button></div>}{selectedOrbit?.data && !position && <p className='text-sm text-destructive'>Não foi possível calcular a posição com os elementos recebidos.</p>}
          <div><SectionHeading title='Posição calculada' subtitle='Estimativa SGP4 para o horário UTC atual' /><div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'><Metric icon={Gauge} label='Latitude' value={position ? `${fmt(position.latitude)}°` : '—'} /><Metric icon={Gauge} label='Longitude' value={position ? `${fmt(position.longitude)}°` : '—'} /><Metric icon={Orbit} label='Altitude' value={position ? `${fmt(position.altitude)} km` : '—'} /><Metric icon={Gauge} label='Velocidade' value={position ? `${fmt(position.velocity)} km/s` : '—'} /></div></div>
          <div><SectionHeading title='Recepção pública e telemetria' subtitle='Estado da última observação pública; não representa um enlace contínuo nem a intensidade do sinal' /><div className='grid gap-3 sm:grid-cols-3'><Metric icon={Thermometer} label='Temperatura' value='Indisponível' hint='Sem telemetria decodificada' /><Metric icon={BatteryMedium} label='Bateria' value='Indisponível' hint='Sem telemetria decodificada' /><Metric icon={Radio} label='Estado da recepção' value={receptionValue} hint={receptionHint} /></div><div className='mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground'><span>Intensidade (dBm) e SNR não são fornecidos nesta observação.</span>{latestObservation?.url ? <a className='font-medium underline underline-offset-4' href={latestObservation.url} target='_blank' rel='noreferrer'>Ver observação no SatNOGS · CC BY-SA</a> : <a className='font-medium underline underline-offset-4' href='https://network.satnogs.org/' target='_blank' rel='noreferrer'>Fonte: SatNOGS Network · CC BY-SA</a>}</div>{latestObservation && <p className='mt-2 text-xs text-muted-foreground'>Frequência observada: {latestObservation.frequency_hz ? `${(latestObservation.frequency_hz / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 4 })} MHz` : 'não informada'}{latestObservation.mode ? ` · Modo ${latestObservation.mode}` : ''} · início {new Date(latestObservation.start).toLocaleString('pt-BR')}</p>}</div>
          <div><SectionHeading title='Idade e origem dos dados' subtitle='A época indica quando os elementos orbitais foram válidos; consulta indica quando a API entregou a resposta' /><div className='grid gap-3 md:grid-cols-3'><AgeCard label='Idade da época orbital' value={epoch?.label ?? 'Indisponível'} status={epochFreshness} /><AgeCard label='Última consulta à API' value={retrieved?.label ?? 'Indisponível'} status={freshness(retrieved?.minutes)} /><div className='rounded-xl border bg-muted/20 p-4'><p className='text-xs uppercase tracking-wide text-muted-foreground'>Fonte orbital</p><p className='mt-2 font-semibold'>{selectedOrbit?.data?.source ?? 'CelesTrak'}</p><p className='mt-1 text-xs text-muted-foreground'>{selectedOrbit?.data?.retrieved_at ? new Date(selectedOrbit.data.retrieved_at).toLocaleString('pt-BR') : 'Aguardando consulta'}</p></div></div></div>
          <div><SectionHeading title='Detalhes da órbita' subtitle='Elementos publicados pelo CelesTrak e período derivado do movimento médio' /><div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'><OrbitMetric label='Inclinação' value={elements ? `${fmt(Number(elements.INCLINATION))}°` : '—'} /><OrbitMetric label='Excentricidade' value={Number.isFinite(eccentricity) ? fmt(eccentricity, 6) : '—'} /><OrbitMetric label='Movimento médio' value={elements && Number.isFinite(meanMotion) ? `${fmt(meanMotion, 5)} rev/dia` : '—'} /><OrbitMetric label='Período orbital calculado' value={periodMinutes ? `${fmt(periodMinutes)} min` : '—'} /><OrbitMetric label='Ascensão do nó' value={elements ? `${fmt(Number(elements.RA_OF_ASC_NODE))}°` : '—'} /><OrbitMetric label='Argumento do perigeu' value={elements ? `${fmt(Number(elements.ARG_OF_PERICENTER))}°` : '—'} /><OrbitMetric label='Anomalia média' value={elements ? `${fmt(Number(elements.MEAN_ANOMALY))}°` : '—'} /><OrbitMetric label='Época dos elementos' value={typeof elements?.EPOCH === 'string' ? new Date(elements.EPOCH.endsWith('Z') ? elements.EPOCH : `${elements.EPOCH}Z`).toLocaleString('pt-BR') : '—'} /></div><p className='mt-3 text-xs text-muted-foreground'>O período é derivado de 1.440 ÷ movimento médio (rev/dia). A posição muda com o relógio, mas representa uma propagação orbital, não uma leitura de sensor.</p></div>
        </div></CardContent></Card></section>}
      <section aria-label='Passagens e eventos' className='grid gap-4 lg:grid-cols-2'><Card><CardHeader><CardTitle>Próximas passagens</CardTitle><p className='text-xs text-muted-foreground'>Previsões sobre estações terrestres</p></CardHeader><CardContent className='rounded-b-xl bg-muted/10 py-6 text-sm text-muted-foreground'>Previsões ainda não disponíveis. Para calcular passagens, será necessário cadastrar as coordenadas das estações.</CardContent></Card><Card><CardHeader><CardTitle>Eventos</CardTitle><p className='text-xs text-muted-foreground'>Alertas e ocorrências da frota</p></CardHeader><CardContent className='rounded-b-xl bg-muted/10 py-6 text-sm text-muted-foreground'>Ainda não há uma fonte de eventos de telemetria conectada.</CardContent></Card></section>
      <div className='mt-4 flex justify-center'><Button variant='outline' size='lg' aria-expanded={advancedOpen} aria-controls='monitoring-advanced' onClick={() => setAdvancedOpen((value) => !value)}>{advancedOpen ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}{advancedOpen ? 'Recolher dados avançados' : 'Dados avançados'}</Button></div>
      {advancedOpen && <section id='monitoring-advanced' className='grid gap-4 border-t border-dashed pt-5 md:grid-cols-2' aria-label='Dados avançados'><div className='md:col-span-2'><p className='text-lg font-semibold'>Camada avançada de monitoramento</p><p className='text-sm text-muted-foreground'>Área expansível reservada para os próximos indicadores da plataforma.</p></div><AdvancedCard icon={Clock3} title='Janela de visibilidade' description='Aguardando localização de uma estação terrestre para estimar aquisição e perda de sinal.' /><AdvancedCard icon={Activity} title='Qualidade da propagação' description='A idade dos elementos orbitais está indicada acima; dados mais antigos reduzem a confiança da estimativa.' /><AdvancedCard icon={Radio} title='Enlace e telemetria' description='SNR, potência recebida, frequência e estado do enlace poderão entrar aqui quando houver uma fonte conectada.' /><AdvancedCard icon={Orbit} title='Parâmetros orbitais adicionais' description='Próximos campos podem incluir apogeu, perigeu e passagens previstas, com método e fonte identificados.' /></section>}
    </>}
  </Main><AddSatellite open={open} onOpenChange={setOpen} /></>
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) { return <div className='mb-3'><h3 className='font-semibold'>{title}</h3><p className='text-xs text-muted-foreground'>{subtitle}</p></div> }
function Metric({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: string; hint?: string }) { return <Card className='border-border/70 bg-card/70'><CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'><CardTitle className='text-[11px] font-medium uppercase tracking-wider text-muted-foreground'>{label}</CardTitle><Icon className='size-4 text-muted-foreground' /></CardHeader><CardContent><p className='text-lg font-semibold leading-tight'>{value}</p>{hint && <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>}</CardContent></Card> }
function AgeCard({ label, value, status }: { label: string; value: string; status: { label: string; classes: string } }) { return <div className='rounded-xl border bg-muted/20 p-4'><div className='flex items-center justify-between gap-2'><p className='text-xs uppercase tracking-wide text-muted-foreground'>{label}</p><span className={`rounded-full border px-2 py-0.5 text-[10px] ${status.classes}`}>{status.label}</span></div><p className='mt-3 text-lg font-semibold'>{value}</p></div> }
function OrbitMetric({ label, value }: { label: string; value: string }) { return <div className='rounded-xl border bg-muted/20 p-4'><p className='text-xs text-muted-foreground'>{label}</p><p className='mt-2 break-words font-mono text-sm font-semibold'>{value}</p></div> }
function AdvancedCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) { return <Card className='border-dashed bg-muted/[0.12]'><CardContent className='flex gap-3 p-4'><span className='rounded-lg bg-primary/10 p-2 text-primary'><Icon className='size-4' /></span><div><p className='font-medium'>{title}</p><p className='mt-1 text-sm text-muted-foreground'>{description}</p></div></CardContent></Card> }
