import { useEffect, useState } from 'react'

/**
 * Relógio da missão: devolve a data atual e um contador em segundos
 * desde a montagem, atualizado a cada `intervalMs`.
 */
export function useMissionClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  const [start] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return { now, elapsed: (now.getTime() - start) / 1000 }
}

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const months = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const pad = (n: number) => String(n).padStart(2, '0')

export function formatUtc(d: Date) {
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

export function formatLive(d: Date) {
  return `${weekdays[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${formatUtc(d)} UTC`
}
