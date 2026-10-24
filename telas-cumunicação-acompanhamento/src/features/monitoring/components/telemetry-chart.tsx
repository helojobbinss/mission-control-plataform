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
import { type Satellite, type Telemetry, telemetryAt } from '../data/fleet'

type MetricKey = 'signal' | 'battery' | 'temperature' | 'snr'

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

export function TelemetryChart({
  satellite,
  elapsed,
  now,
}: {
  satellite: Satellite
  elapsed: number
  now: Date
}) {
  const [metric, setMetric] = useState<MetricKey>('signal')
  const current = metrics.find((m) => m.key === metric)!

  const data = Array.from({ length: SAMPLES }, (_, i) => {
    const back = (SAMPLES - 1 - i) * STEP
    const tel: Telemetry = telemetryAt(satellite, elapsed - back)
    return {
      time: formatUtc(new Date(now.getTime() - back * 1000)),
      value: Number(tel[metric].toFixed(1)),
    }
  })

  const offline = satellite.status === 'OFFLINE'

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-1'>
        {metrics.map((m) => (
          <button
            key={m.key}
            type='button'
            onClick={() => setMetric(m.key)}
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

      <div className='relative h-[220px]'>
        {offline && (
          <div className='absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70 font-mono text-xs tracking-[0.2em] text-red-400 uppercase'>
            Sem telemetria · último contato {satellite.lastContact}
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
              interval={9}
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
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
