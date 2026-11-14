import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  activeLinks,
  satById,
  satellites,
  telemetryAt,
} from '@/features/monitoring/data/fleet'
import { CommChannelContext } from '../context/comm-channel-context'
import {
  type CommMessage,
  type CommandCode,
  type Priority,
  commandReplies,
  commands,
  initialMessages,
  nextId,
} from '../data/messages'

/**
 * Estado do canal de comunicação + simulação do ciclo de vida de um
 * telecomando: PENDENTE → ENVIADO → ACK/FALHA (ou ENFILEIRADO sem enlace).
 * Sem transporte externo. Mensagens e confirmações existem apenas nesta sessão.
 */
export function useDemoCommChannel() {
  const [messages, setMessages] = useState<CommMessage[]>(initialMessages)
  const [beaconsEnabled, setBeaconsEnabled] = useState(true)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  const patch = useCallback((id: string, changes: Partial<CommMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...changes } : m))
    )
  }, [])

  const push = useCallback((msg: CommMessage) => {
    setMessages((prev) => [...prev, msg].slice(-300))
  }, [])

  const later = useCallback((ms: number, fn: () => void) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      fn()
    }, ms)
    timers.current.add(timer)
  }, [])

  useEffect(() => {
    const list = timers.current
    return () => {
      list.forEach(clearTimeout)
      list.clear()
    }
  }, [])

  // Beacons periódicos dos satélites com enlace
  useEffect(() => {
    if (!beaconsEnabled) return
    const id = setInterval(() => {
      const linked = satellites.filter((s) => activeLinks[s.id])
      if (linked.length === 0) return
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
  }, [push, beaconsEnabled])

  const sendCommand = useCallback(
    (args: {
      satelliteId: string
      code: CommandCode
      params: string
      priority: Priority
      operator: string
    }) => {
      if (
        !satellites.some((sat) => sat.id === args.satelliteId) ||
        !commands.some((command) => command.code === args.code)
      )
        return
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
        toast.warning(`Simulação: ${sat.name} sem enlace`, {
          description: `${args.code} permanece na fila local; não há envio automático a satélites.`,
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
          toast.error(`Simulação: ${args.code} sem confirmação`, {
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
    [patch, push, later]
  )

  const addNote = useCallback(
    (satelliteId: string, content: string, operator: string) => {
      if (!content.trim() || !satellites.some((sat) => sat.id === satelliteId))
        return
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
      if (
        msg.direction !== 'UP' ||
        msg.status !== 'FALHA' ||
        !commands.some((command) => command.code === msg.code)
      )
        return
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

  return {
    messages,
    sendCommand,
    addNote,
    retry,
    beaconsEnabled,
    setBeaconsEnabled,
  }
}

export function useCommChannel() {
  const channel = useContext(CommChannelContext)
  if (!channel) throw new Error('Comunicação requer uma sessão autenticada.')
  return channel
}
