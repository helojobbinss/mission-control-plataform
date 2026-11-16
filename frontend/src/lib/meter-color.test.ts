import { describe, expect, it } from 'vitest'
import { meterColor } from './meter-color'

// CT-009: valores limite das decisões de apresentação já implementadas.
describe('CT-009: semáforo de telemetria', () => {
  it.each([
    [0, '#ff5263'], [29.99, '#ff5263'], [30, '#fbbf24'],
    [69.99, '#fbbf24'], [70, '#10dba4'], [100, '#10dba4'],
  ])('valor %s recebe %s', (value, expected) => {
    expect(meterColor(value)).toBe(expected)
  })
})
