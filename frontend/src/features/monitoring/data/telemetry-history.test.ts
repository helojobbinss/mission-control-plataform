import { describe, expect, it } from 'vitest'
import { type Telemetry } from './api'
import { appendTelemetrySample, receivedSeries } from './telemetry-history'

function sample(seconds: number, value: number | string = 80): Telemetry {
  return {
    simulated: true,
    timestamp: new Date(seconds * 1000).toISOString(),
    sensors: { battery_level: { value, unit: '%', status: 'normal' } },
    orbital_position: null,
    alerts: [],
  }
}

describe('Received telemetry history', () => {
  it('keeps the latest 40 unique timestamps in chronological order', () => {
    let history: Telemetry[] = []
    for (let seconds = 0; seconds < 45; seconds++)
      history = appendTelemetrySample(history, sample(seconds))
    history = appendTelemetrySample(history, sample(44, 90))
    expect(history).toHaveLength(40)
    expect(history[0].timestamp).toBe(sample(5).timestamp)
    expect(history[39].sensors.battery_level.value).toBe(90)
    expect(appendTelemetrySample(history, sample(1))).toEqual(history)
  })
  it('does not invent values for missing, textual or non-finite readings', () => {
    expect(
      receivedSeries(
        [sample(0, 'offline'), sample(1, Number.NaN), sample(2, 52)],
        'battery'
      ).map((point) => point.value)
    ).toEqual([null, null, 52])
    expect(receivedSeries([sample(0)], 'voltage')[0].value).toBeNull()
    expect(receivedSeries([], 'battery')).toEqual([])
  })
  it('ignores timestamps that cannot be plotted', () => {
    const previous = [sample(1)]
    expect(
      appendTelemetrySample(previous, { ...sample(2), timestamp: 'invalid' })
    ).toBe(previous)
  })
})
