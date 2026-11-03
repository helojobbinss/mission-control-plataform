import { useState } from 'react'
import {
  BatteryMedium,
  Clock,
  Gauge,
  Orbit,
  Radio,
  Satellite as SatelliteIcon,
  Thermometer,
  Timer,
} from 'lucide-react'
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
import { OrbitView } from './components/orbit-view'
import { TelemetryChart } from './components/telemetry-chart'
import {
  activeLinks,
  orbitalPeriod,
  satById,
  satellites,
  stationById,
  statusColor,
  telemetryAt,
  upcomingPasses,
} from './data/fleet'

const events: Record<string, { time: string; text: string; tone: string }[]> = {
  'SAT-001': [
    {
      time: '22:51',
      text: 'Downlink de dados ambientais concluído (48 MB)',
      tone: '#10dba4',
    },
    {
      time: '22:30',
      text: 'Passagem sobre Natal iniciada (AOS)',
      tone: '#38bdf8',
    },
    { time: '21:12', text: 'Ajuste de atitude nominal', tone: '#94a3b8' },
  ],
  'SAT-002': [
    {
      time: '22:48',
      text: 'Qualidade de sinal abaixo do limiar (61%)',
      tone: '#fbbf24',
    },
    { time: '22:40', text: 'Troca para antena secundária Ka', tone: '#38bdf8' },
    {
      time: '20:05',
      text: 'Painel solar B com eficiência reduzida',
      tone: '#fbbf24',
    },
  ],
  'SAT-003': [
    { time: '22:52', text: 'Telemetria nominal recebida', tone: '#10dba4' },
    {
      time: '22:15',
      text: 'Experimento de carga útil ativado',
      tone: '#38bdf8',
    },
  ],
  'SAT-004': [
    {
      time: '22:39',
      text: 'Bateria abaixo de 20% — ação imediata necessária',
      tone: '#ff5263',
    },
    {
      time: '22:20',
      text: 'Modo de segurança sugerido pelo FDIR',
      tone: '#ff5263',
    },
    {
      time: '21:55',
      text: 'Temperatura do OBC acima de 45 °C',
      tone: '#fbbf24',
    },
  ],
  'SAT-005': [
    {
      time: '06 Out',
      text: 'Perda de sinal (LOS) não programada',
      tone: '#ff5263',
    },
    { time: '06 Out', text: 'Última telemetria: bateria 4%', tone: '#ff5263' },
  ],
  'SAT-006': [
    {
      time: '22:53',
      text: 'Retransmissão estável · 600 Mbps',
      tone: '#10dba4',
    },
    {
      time: '19:00',
      text: 'Manobra de manutenção de posição concluída',
      tone: '#38bdf8',
    },
  ],
}

export function Monitoring() {
  const { now, elapsed } = useMissionClock(1000)
  const [selectedId, setSelectedId] = useState('SAT-001')

  const selected = satById(selectedId)
  const tel = telemetryAt(selected, elapsed)
  const link = activeLinks[selected.id]

  const online = satellites.filter((s) => s.status !== 'OFFLINE')
  const fleetTel = online.map((s) => telemetryAt(s, elapsed))
  const avgSignal = fleetTel.reduce((a, b) => a + b.signal, 0) / fleetTel.length
  const avgBattery =
    fleetTel.reduce((a, b) => a + b.battery, 0) / fleetTel.length
  const nextPass = upcomingPasses[0]
  const nextPassSec = Math.max(0, nextPass.aosIn * 60 - Math.floor(elapsed))

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
          <h1 className='text-2xl font-bold tracking-tight'>
            Acompanhamento de Satélites
          </h1>
          <p className='font-mono text-xs tracking-[0.2em] text-emerald-500 uppercase dark:text-green-300'>
            AO VIVO · {formatLive(now)}
          </p>
        </div>

        {/* ===== KPIs ===== */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Kpi
            title='Em órbita / ativos'
            icon={SatelliteIcon}
            value={`${online.length}/${satellites.length}`}
            color='text-blue-500'
            hint={`${satellites.filter((s) => s.status === 'CRÍTICO' || s.status === 'DEGRADADO').length} com anomalia`}
          />
          <Kpi
            title='Sinal médio'
            icon={Radio}
            value={`${avgSignal.toFixed(0)}%`}
            style={{ color: meterColor(avgSignal) }}
            hint='Frota ativa'
          />
          <Kpi
            title='Bateria média'
            icon={BatteryMedium}
            value={`${avgBattery.toFixed(0)}%`}
            style={{ color: meterColor(avgBattery) }}
            hint='Frota ativa'
          />
          <Kpi
            title='Próxima passagem'
            icon={Timer}
            value={countdown(nextPassSec)}
            color='text-cyan-500'
            hint={`${satById(nextPass.satelliteId).name} → ${stationById(nextPass.stationId).name}`}
          />
        </div>

        {/* ===== Órbitas + Frota ===== */}
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
          <Card className='lg:col-span-4'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <Orbit className='size-4 text-muted-foreground' />
                Rastreamento orbital
              </CardTitle>
              <div className='flex flex-wrap gap-3 font-mono text-[10px] text-muted-foreground'>
                {(
                  ['OPERACIONAL', 'DEGRADADO', 'CRÍTICO', 'OFFLINE'] as const
                ).map((s) => (
                  <span key={s} className='flex items-center gap-1'>
                    <span
                      className='size-2 rounded-full'
                      style={{ backgroundColor: statusColor[s] }}
                    />
                    {s}
                  </span>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <OrbitView selectedId={selectedId} onSelect={setSelectedId} />
            </CardContent>
          </Card>

          <Card className='lg:col-span-3'>
            <CardHeader>
              <CardTitle>Frota</CardTitle>
            </CardHeader>
            <CardContent className='space-y-1.5'>
              {satellites.map((sat) => {
                const t = telemetryAt(sat, elapsed)
                const active = sat.id === selectedId
                return (
                  <button
                    key={sat.id}
                    type='button'
                    onClick={() => setSelectedId(sat.id)}
                    className={cn(
                      'w-full rounded-lg border p-3 text-start transition-colors',
                      active
                        ? 'border-foreground/25 bg-muted/60'
                        : 'border-transparent hover:bg-muted/30'
                    )}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div>
                        <span className='font-semibold'>{sat.name}</span>{' '}
                        <span className='font-mono text-xs text-muted-foreground'>
                          {sat.id} · {sat.orbit}
                        </span>
                      </div>
                      <StatusPill
                        label={sat.status}
                        color={statusColor[sat.status]}
                        pulse={sat.status === 'CRÍTICO'}
                      />
                    </div>
                    <div className='mt-2 grid grid-cols-2 gap-3 font-mono text-[10px] text-muted-foreground'>
                      <div className='space-y-1'>
                        <div className='flex justify-between'>
                          <span>SINAL</span>
                          <span style={{ color: meterColor(t.signal) }}>
                            {t.signal.toFixed(0)}%
                          </span>
                        </div>
                        <MeterBar value={t.signal} />
                      </div>
                      <div className='space-y-1'>
                        <div className='flex justify-between'>
                          <span>BATERIA</span>
                          <span style={{ color: meterColor(t.battery) }}>
                            {t.battery.toFixed(0)}%
                          </span>
                        </div>
                        <MeterBar value={t.battery} />
                      </div>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* ===== Detalhe do satélite selecionado ===== */}
        <Card>
          <CardHeader className='flex flex-row flex-wrap items-start justify-between gap-2'>
            <div>
              <CardTitle className='flex items-center gap-2 text-lg'>
                {selected.name}
                <StatusPill
                  label={selected.status}
                  color={statusColor[selected.status]}
                />
              </CardTitle>
              <p className='mt-1 text-sm text-muted-foreground'>
                {selected.mission} · Operador: {selected.operator}
              </p>
            </div>
            <div className='text-end font-mono text-xs text-muted-foreground'>
              <div>
                ENLACE:{' '}
                {link ? (
                  <span className='text-emerald-500'>
                    {stationById(link).name} · banda {selected.band}
                  </span>
                ) : (
                  <span className='text-red-500'>SEM ENLACE</span>
                )}
              </div>
              <div>ÚLTIMO CONTATO: {selected.lastContact}</div>
            </div>
          </CardHeader>
          <CardContent className='grid gap-6 lg:grid-cols-3'>
            <div className='grid grid-cols-2 gap-3 self-start'>
              <Stat
                icon={Gauge}
                label='Altitude'
                value={tel.altitude ? `${fmt(tel.altitude, 1)} km` : '—'}
              />
              <Stat
                icon={Gauge}
                label='Velocidade'
                value={tel.velocity ? `${fmt(tel.velocity, 2)} km/s` : '—'}
              />
              <Stat
                icon={Orbit}
                label='Inclinação'
                value={`${fmt(selected.inclination, 1)}°`}
              />
              <Stat
                icon={Clock}
                label='Período'
                value={
                  selected.altitude
                    ? `${fmt(orbitalPeriod(selected.altitude), 1)} min`
                    : '—'
                }
              />
              <Stat
                icon={Thermometer}
                label='Temperatura'
                value={`${fmt(tel.temperature, 1)} °C`}
                color={tel.temperature > 40 ? '#ff5263' : undefined}
              />
              <Stat
                icon={BatteryMedium}
                label='Bateria'
                value={`${fmt(tel.battery, 1)}%`}
                color={meterColor(tel.battery)}
              />
            </div>
            <div className='lg:col-span-2'>
              <TelemetryChart
                satellite={selected}
                elapsed={elapsed}
                now={now}
              />
            </div>
          </CardContent>
        </Card>

        {/* ===== Passagens + Eventos ===== */}
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
          <Card className='lg:col-span-4'>
            <CardHeader>
              <CardTitle>Próximas passagens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='w-full overflow-x-auto'>
                <table className='w-full min-w-[520px] text-sm'>
                  <thead>
                    <tr className='border-b border-border text-muted-foreground'>
                      <th className='px-3 py-2 text-start font-normal'>
                        Satélite
                      </th>
                      <th className='px-3 py-2 text-start font-normal'>
                        Estação
                      </th>
                      <th className='px-3 py-2 text-center font-normal'>
                        AOS em
                      </th>
                      <th className='px-3 py-2 text-center font-normal'>
                        Duração
                      </th>
                      <th className='px-3 py-2 text-center font-normal'>
                        Elev. máx
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingPasses.map((p, i) => {
                      const sat = satById(p.satelliteId)
                      const st = stationById(p.stationId)
                      const secs = Math.max(
                        0,
                        p.aosIn * 60 - Math.floor(elapsed)
                      )
                      return (
                        <tr
                          key={i}
                          onClick={() => setSelectedId(sat.id)}
                          className={cn(
                            'cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/30',
                            sat.id === selectedId && 'bg-muted/40'
                          )}
                        >
                          <td className='px-3 py-2.5'>
                            <span className='font-semibold'>{sat.name}</span>
                          </td>
                          <td className='px-3 py-2.5 text-muted-foreground'>
                            {st.name}
                          </td>
                          <td
                            className={cn(
                              'px-3 py-2.5 text-center font-mono',
                              secs < 600 ? 'text-emerald-500' : 'text-cyan-500'
                            )}
                          >
                            {countdown(secs)}
                          </td>
                          <td className='px-3 py-2.5 text-center font-mono'>
                            {p.durationMin} min
                          </td>
                          <td className='px-3 py-2.5 text-center font-mono'>
                            {p.maxElevation}°
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className='lg:col-span-3'>
            <CardHeader>
              <CardTitle>Eventos · {selected.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className='relative space-y-5 border-s border-border ps-5'>
                {events[selected.id].map((e, i) => (
                  <li key={i} className='relative'>
                    <span
                      className='absolute -start-[25px] top-1 size-2.5 rounded-full ring-4 ring-card'
                      style={{ backgroundColor: e.tone }}
                    />
                    <p className='font-mono text-[11px] text-muted-foreground'>
                      {e.time} UTC
                    </p>
                    <p className='text-sm'>{e.text}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

// ---------------------------------------------------------------------------

function fmt(n: number, digits: number) {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function countdown(totalSec: number) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `T-${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function Kpi({
  title,
  icon: Icon,
  value,
  hint,
  color,
  style,
}: {
  title: string
  icon: React.ElementType
  value: string
  hint: string
  color?: string
  style?: React.CSSProperties
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
        <div
          className={cn('font-mono text-2xl font-bold tabular-nums', color)}
          style={style}
        >
          {value}
        </div>
        <p className='text-xs text-muted-foreground'>{hint}</p>
      </CardContent>
    </Card>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color?: string
}) {
  return (
    <div className='rounded-lg border bg-muted/20 p-3'>
      <div className='flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase'>
        <Icon className='size-3' />
        {label}
      </div>
      <div
        className='mt-1 font-mono text-base font-semibold tabular-nums'
        style={{ color }}
      >
        {value}
      </div>
    </div>
  )
}
