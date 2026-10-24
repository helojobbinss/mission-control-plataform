import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  activeLinks,
  satById,
  satellites,
  telemetryAt,
} from '@/features/monitoring/data/fleet'
import {
  type CommMessage,
  type CommandCode,
  type Priority,
  commandReplies,
  initialMessages,
  nextId,
} from '../data/messages'

/**
 * Estado do canal de comunicação + simulação do ciclo de vida de um
 * telecomando: PENDENTE → ENVIADO → ACK/FALHA (ou ENFILEIRADO sem enlace).
 * Ao integrar com o backend, trocar os setTimeout por WebSocket/SSE.
 */
export function useCommChannel() {
  const [messages, setMessages] = useState<CommMessage[]>(initialMessages)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const patch = useCallback((id: string, changes: Partial<CommMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...changes } : m))
    )
  }, [])

  const push = useCallback((msg: CommMessage) => {
    setMessages((prev) => [...prev, msg])
  }, [])

  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms))
  }

  useEffect(() => {
    const list = timers.current
    return () => list.forEach(clearTimeout)
  }, [])

  // Beacons periódicos dos satélites com enlace
  useEffect(() => {
    const id = setInterval(() => {
      const linked = satellites.filter((s) => activeLinks[s.id])
      const sat = linked[Math.floor(Math.random() * linked.length)]
      const tel = telemetryAt(sat, Date.now() / 1000)
      push({
        id: nextId(),
        satelliteId: sat.id,
        direction: 'DOWN',
        code: 'BEACON',
        content: `Beacon · sinal ${tel.signal.toFixed(0)}% · bateria ${tel.battery.toFixed(0)}% · ${tel.temperature.toFixed(1)} °C`,
        stationId: activeLinks[sat.id],
        time: new Date(),
        status: 'RECEBIDO',
      })
    }, 12_000)
    return () => clearInterval(id)
  }, [push])

  const sendCommand = useCallback(
    (args: {
      satelliteId: string
      code: CommandCode
      params: string
      priority: Priority
      operator: string
    }) => {
      const sat = satById(args.satelliteId)
      const station = activeLinks[sat.id]
      const id = nextId()

      push({
        id,
        satelliteId: sat.id,
        direction: 'UP',
        code: args.code,
        content: args.params || '—',
        stationId: station,
        time: new Date(),
        status: station ? 'PENDENTE' : 'ENFILEIRADO',
        operator: args.operator,
        priority: args.priority,
      })

      if (!station) {
        toast.warning(`${sat.name} sem enlace`, {
          description: `${args.code} enfileirado para a próxima janela de contato.`,
        })
        return
      }

      later(900, () => patch(id, { status: 'ENVIADO' }))

      const signal = telemetryAt(sat, Date.now() / 1000).signal
      const fails = signal < 30 && Math.random() < 0.5
      const latency = 1800 + Math.random() * 1200

      later(latency, () => {
        patch(id, { status: fails ? 'FALHA' : 'ACK' })
        if (fails) {
          toast.error(`${args.code} sem confirmação`, {
            description: `${sat.name}: sinal fraco (${signal.toFixed(0)}%). Tente na próxima passagem.`,
          })
          return
        }
        later(700, () =>
          push({
            id: nextId(),
            satelliteId: sat.id,
            direction: 'DOWN',
            code: 'ACK',
            content: `${args.code} → ${commandReplies[args.code]}`,
            stationId: station,
            time: new Date(),
            status: 'RECEBIDO',
          })
        )
      })
    },
    [patch, push]
  )

  const addNote = useCallback(
    (satelliteId: string, content: string, operator: string) => {
      push({
        id: nextId(),
        satelliteId,
        direction: 'NOTE',
        code: 'NOTA',
        content,
        stationId: null,
        time: new Date(),
        status: 'RECEBIDO',
        operator,
      })
    },
    [push]
  )

  const retry = useCallback(
    (msg: CommMessage) => {
      sendCommand({
        satelliteId: msg.satelliteId,
        code: msg.code as CommandCode,
        params: msg.content === '—' ? '' : msg.content,
        priority: msg.priority ?? 'NORMAL',
        operator: msg.operator ?? 'Admin',
      })
    },
    [sendCommand]
  )

  return { messages, sendCommand, addNote, retry }
}
