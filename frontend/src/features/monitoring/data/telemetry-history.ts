import { type Telemetry } from './api'

export const TELEMETRY_HISTORY_LIMIT = 40

export function appendTelemetrySample(
  previous: Telemetry[] = [],
  sample: Telemetry
): Telemetry[] {
  if (!Number.isFinite(Date.parse(sample.timestamp))) return previous
  return [
    ...previous.filter((reading) => reading.timestamp !== sample.timestamp),
    sample,
  ]
    .sort(
      (left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp)
    )
    .slice(-TELEMETRY_HISTORY_LIMIT)
}

export const telemetrySensors = {
  battery: 'battery_level',
  temperature: 'internal_temperature',
  voltage: 'voltage',
  current: 'current',
} as const

export function receivedSeries(
  samples: Telemetry[],
  metric: keyof typeof telemetrySensors
) {
  return samples.map((sample) => {
    const value = sample.sensors[telemetrySensors[metric]]?.value
    return {
      time: sample.timestamp,
      value: typeof value === 'number' && Number.isFinite(value) ? value : null,
    }
  })
}
