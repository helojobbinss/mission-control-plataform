import { Activity, Clock4, RadioTower, Send, Waves } from 'lucide-react'
import { meterColor } from '@/lib/meter-color'
import { cn } from '@/lib/utils'
import { formatLive, useMissionClock } from '@/hooks/use-mission-clock'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { MeterBar, StatusPill } from '@/components/status-pill'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  activeLinks,
  groundStations,
  satById,
  satellites,
  stationColor,
  telemetryAt,
} from '@/features/monitoring/data/fleet'
import { CommsConsole } from './components/comms-console'
import { useCommChannel } from './hooks/use-comm-channel'

export function Communications() {
  const { now, elapsed } = useMissionClock(2000)
  const { messages, sendCommand, addNote, retry } = useCommChannel()

  const links = satellites
    .filter((s) => activeLinks[s.id])
    .map((s) => ({
      sat: s,
      station: activeLinks[s.id]!,
      tel: telemetryAt(s, elapsed),
    }))

  const onlineStations = groundStations.filter(
    (g) => g.status === 'ONLINE'
  ).length
  const totalRate = links.reduce((a, l) => a + l.tel.dataRate, 0)
  const pending = messages.filter(
    (m) =>
      m.direction === 'UP' &&
      ['PENDENTE', 'ENVIADO', 'ENFILEIRADO'].includes(m.status)
  ).length
  const failed = messages.filter(
    (m) => m.direction === 'UP' && m.status === 'FALHA'
  ).length

  return (
    <>
      <Header>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Comunicações</h1>
          <p className='font-mono text-xs tracking-[0.2em] text-emerald-500 uppercase dark:text-green-300'>
            AO VIVO · {formatLive(now)}
          </p>
        </div>

        {/* ===== KPIs ===== */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Kpi
            title='Enlaces ativos'
            icon={Activity}
            value={`${links.length}/${satellites.length}`}
            color='text-green-500'
            hint={`${satellites.length - links.length} satélite sem contato`}
          />
          <Kpi
            title='Estações terrestres'
            icon={RadioTower}
            value={`${onlineStations}/${groundStations.length}`}
            color='text-yellow-500'
            hint={`${groundStations.length - onlineStations} em manutenção`}
          />
          <Kpi
            title='Downlink total'
            icon={Waves}
            value={`${totalRate.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} Mbps`}
            color='text-cyan-500'
            hint='Soma dos enlaces ativos'
          />
          <Kpi
            title='Comandos em curso'
            icon={Send}
            value={String(pending)}
            color={failed > 0 ? 'text-red-500' : 'text-blue-500'}
            hint={
              failed > 0
                ? `${failed} sem confirmação (FALHA)`
                : 'Todos confirmados'
            }
          />
        </div>

        {/* ===== Console ===== */}
        <CommsConsole
          messages={messages}
          onSend={sendCommand}
          onNote={addNote}
          onRetry={retry}
        />

        {/* ===== Enlaces + Estações ===== */}
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
          <Card className='lg:col-span-4'>
            <CardHeader>
              <CardTitle>Enlaces ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='w-full overflow-x-auto'>
                <table className='w-full min-w-[540px] text-sm whitespace-nowrap'>
                  <thead>
                    <tr className='border-b border-border text-muted-foreground'>
                      <th className='px-2 py-2 text-start font-normal'>
                        Enlace
                      </th>
                      <th className='px-2 py-2 text-center font-normal'>
                        Banda
                      </th>
                      <th className='px-2 py-2 text-center font-normal'>SNR</th>
                      <th className='px-2 py-2 text-center font-normal'>
                        Taxa
                      </th>
                      <th className='px-2 py-2 text-center font-normal'>
                        Latência
                      </th>
                      <th className='px-2 py-2 text-start font-normal'>
                        Qualidade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map(({ sat, station, tel }) => (
                      <tr
                        key={sat.id}
                        className='border-b border-border/60 last:border-0 hover:bg-muted/30'
                      >
                        <td className='px-3 py-2.5'>
                          <span className='font-semibold'>{sat.name}</span>
                          <span className='text-muted-foreground'> ↔ </span>
                          <span className='text-muted-foreground'>
                            {groundStations.find((g) => g.id === station)!.name}
                          </span>
                        </td>
                        <td className='px-2 py-2.5 text-center font-mono'>
                          {sat.band}
                        </td>
                        <td className='px-2 py-2.5 text-center font-mono tabular-nums'>
                          {num(tel.snr, 1)} dB
                        </td>
                        <td className='px-2 py-2.5 text-center font-mono text-cyan-500 tabular-nums'>
                          {formatRate(tel.dataRate)}
                        </td>
                        <td className='px-2 py-2.5 text-center font-mono tabular-nums'>
                          {num(tel.latency, 0)} ms
                        </td>
                        <td className='px-3 py-2.5'>
                          <div className='flex items-center gap-2'>
                            <MeterBar value={tel.signal} className='w-14' />
                            <span
                              className='w-9 text-end font-mono text-xs tabular-nums'
                              style={{ color: meterColor(tel.signal) }}
                            >
                              {tel.signal.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className='lg:col-span-3'>
            <CardHeader>
              <CardTitle>Estações terrestres</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {groundStations.map((g) => {
                const serving = satellites.filter(
                  (s) => activeLinks[s.id] === g.id
                )
                return (
                  <div key={g.id} className='rounded-lg border p-3'>
                    <div className='flex items-center justify-between gap-2'>
                      <div>
                        <span className='font-semibold'>{g.name}</span>{' '}
                        <span className='font-mono text-xs text-muted-foreground'>
                          {g.id}
                        </span>
                      </div>
                      <StatusPill
                        label={g.status}
                        color={stationColor[g.status]}
                        pulse={g.status === 'ONLINE' && serving.length > 0}
                      />
                    </div>
                    <div className='mt-1 font-mono text-[11px] text-muted-foreground'>
                      {g.location} · {g.antenna} · bandas {g.bands.join('/')}
                    </div>
                    <div className='mt-2 flex flex-wrap items-center gap-1.5 text-xs'>
                      {g.status !== 'ONLINE' ? (
                        <span className='flex items-center gap-1 text-amber-500'>
                          <Clock4 className='size-3.5' /> Retorno previsto: 25
                          Out · 08:00 UTC
                        </span>
                      ) : serving.length === 0 ? (
                        <span className='text-muted-foreground'>
                          Ociosa · aguardando passagem
                        </span>
                      ) : (
                        serving.map((s) => (
                          <span
                            key={s.id}
                            className={cn(
                              'rounded border px-1.5 py-0.5 font-mono text-[10px]',
                              'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                            )}
                          >
                            {satById(s.id).name}
                          </span>
                        ))
                      )}
                      {g.status === 'ONLINE' && (
                        <span className='ms-auto font-mono text-[10px] text-muted-foreground'>
                          uptime {g.uptime.toLocaleString('pt-BR')}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

function num(n: number, digits: number) {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatRate(mbps: number) {
  if (mbps === 0) return '—'
  if (mbps < 1) return `${num(mbps * 1000, 1)} kbps`
  return `${mbps.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} Mbps`
}

function Kpi({
  title,
  icon: Icon,
  value,
  hint,
  color,
}: {
  title: string
  icon: React.ElementType
  value: string
  hint: string
  color?: string
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-0'>
        <CardTitle className='font-mono text-xs font-normal tracking-[0.2em] uppercase'>
          {title}
        </CardTitle>
        <Icon className='size-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className={cn('font-mono text-2xl font-bold tabular-nums', color)}>
          {value}
        </div>
        <p className='text-xs text-muted-foreground'>{hint}</p>
      </CardContent>
    </Card>
  )
}
