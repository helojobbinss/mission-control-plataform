import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import { formatUtc } from '@/hooks/use-mission-clock'
import { type Telemetry as ApiTelemetry } from '../data/api'
import { type Satellite, type Telemetry, telemetryAt } from '../data/fleet'
import {
  receivedSeries,
  type telemetrySensors,
} from '../data/telemetry-history'

type MetricKey =
  'signal' | 'battery' | 'temperature' | 'snr' | 'voltage' | 'current'

const metrics: {
  key: MetricKey
  label: string
  unit: string
  color: string
  domain: [number | 'auto', number | 'auto']
}[] = [
  {
    key: 'signal',
    label: 'Sinal',
    unit: '%',
    color: '#10dba4',
    domain: [0, 100],
  },
  {
    key: 'battery',
    label: 'Bateria',
    unit: '%',
    color: '#38bdf8',
    domain: [0, 100],
  },
  {
    key: 'temperature',
    label: 'Temperatura',
    unit: '°C',
    color: '#fb923c',
    domain: ['auto', 'auto'],
  },
  { key: 'snr', label: 'SNR', unit: 'dB', color: '#a78bfa', domain: [0, 30] },
]

const SAMPLES = 40
const STEP = 3 // segundos entre amostras

const receivedMetrics: typeof metrics = [
  metrics[1],
  metrics[2],
  {
    key: 'voltage',
    label: 'Tensão',
    unit: 'V',
    color: '#a78bfa',
    domain: ['auto', 'auto'],
  },
  {
    key: 'current',
    label: 'Corrente',
    unit: 'A',
    color: '#10dba4',
    domain: ['auto', 'auto'],
  },
]

export function TelemetryChart(
  props:
    | {
        satellite: Satellite
        elapsed: number
        now: Date
      }
    | { samples: ApiTelemetry[] }
) {
  const [metric, setMetric] = useState<MetricKey>(
    'samples' in props ? 'battery' : 'signal'
  )
  const received = 'samples' in props
  const available = received ? receivedMetrics : metrics
  const current = available.find((m) => m.key === metric) ?? available[0]

  const data =
    'samples' in props
      ? receivedSeries(
          props.samples,
          current.key as keyof typeof telemetrySensors
        ).map((point) => ({ ...point, time: formatUtc(new Date(point.time)) }))
      : Array.from({ length: SAMPLES }, (_, i) => {
          const back = (SAMPLES - 1 - i) * STEP
          const tel: Telemetry = telemetryAt(
            props.satellite,
            props.elapsed - back
          )
          return {
            time: formatUtc(new Date(props.now.getTime() - back * 1000)),
            value: Number(tel[current.key as keyof Telemetry]?.toFixed(1)),
          }
        })

  const offline = 'satellite' in props && props.satellite.status === 'OFFLINE'

  return (
    <div className='space-y-3'>
      <p className='text-xs text-muted-foreground'>
        {received
          ? `${props.samples.length} leitura(s) desta sessão · sensores simulados · horários UTC. Exibe até 40 leituras recentes; não recupera histórico anterior.`
          : 'Curva demonstrativa gerada localmente; não representa amostras recebidas.'}
      </p>
      <div className='flex flex-wrap gap-1'>
        {available.map((m) => (
          <button
            key={m.key}
            type='button'
            onClick={() => setMetric(m.key)}
            aria-pressed={current.key === m.key}
            className={cn(
              'rounded-md border px-2.5 py-1 font-mono text-[11px] tracking-wider uppercase transition-colors',
              metric === m.key
                ? 'border-foreground/30 bg-muted text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {received && !data.some((point) => point.value !== null) ? (
        <p role='status' className='py-6 text-sm text-muted-foreground'>
          Aguardando amostras numéricas deste sensor.
        </p>
      ) : (
        <>
          <div className='relative h-[220px]'>
            {offline && (
              <div className='absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70 font-mono text-xs tracking-[0.2em] text-red-400 uppercase'>
                Sem telemetria · último contato{' '}
                {'satellite' in props ? props.satellite.lastContact : ''}
              </div>
            )}
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={data}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray='3 6'
                  className='stroke-border'
                  vertical={false}
                />
                <XAxis
                  dataKey='time'
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  minTickGap={30}
                  className='font-mono'
                  stroke='#888888'
                />
                <YAxis
                  domain={current.domain}
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  stroke='#888888'
                  tickFormatter={(v) => `${v}${current.unit}`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{
                    color: 'var(--muted-foreground)',
                    fontFamily: 'monospace',
                  }}
                  formatter={(v) => [`${v} ${current.unit}`, current.label]}
                />
                <Line
                  type='monotone'
                  dataKey='value'
                  stroke={current.color}
                  strokeWidth={2}
                  dot={data.length === 1}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
