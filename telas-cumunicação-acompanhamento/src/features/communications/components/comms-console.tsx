import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Send,
  StickyNote,
  TerminalSquare,
  WifiOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatUtc } from '@/hooks/use-mission-clock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusPill } from '@/components/status-pill'
import {
  activeLinks,
  satById,
  satellites,
  stationById,
  statusColor,
} from '@/features/monitoring/data/fleet'
import {
  type CommMessage,
  type CommandCode,
  type Direction,
  type Priority,
  commands,
  messageStatusColor,
  priorityColor,
} from '../data/messages'

type Filter = 'ALL' | Direction

const filters: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'UP', label: 'Uplink' },
  { value: 'DOWN', label: 'Downlink' },
  { value: 'NOTE', label: 'Notas' },
]

const OPERATOR = 'Admin'

export function CommsConsole({
  messages,
  onSend,
  onNote,
  onRetry,
}: {
  messages: CommMessage[]
  onSend: (a: {
    satelliteId: string
    code: CommandCode
    params: string
    priority: Priority
    operator: string
  }) => void
  onNote: (satelliteId: string, content: string, operator: string) => void
  onRetry: (msg: CommMessage) => void
}) {
  const [selectedId, setSelectedId] = useState('SAT-002')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [mode, setMode] = useState<'CMD' | 'NOTE'>('CMD')
  const [code, setCode] = useState<CommandCode>('PING')
  const [priority, setPriority] = useState<Priority>('NORMAL')
  const [text, setText] = useState('')
  const [seen, setSeen] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      satellites.map((s) => [
        s.id,
        messages.filter((m) => m.satelliteId === s.id).length,
      ])
    )
  )

  const sat = satById(selectedId)
  const station = activeLinks[selectedId]

  const channel = useMemo(
    () => messages.filter((m) => m.satelliteId === selectedId),
    [messages, selectedId]
  )
  const visible = channel.filter(
    (m) => filter === 'ALL' || m.direction === filter
  )

  const countOf = (id: string) =>
    messages.filter((m) => m.satelliteId === id).length

  // ao trocar de canal, marca como lidos o canal que sai e o que entra
  const openChannel = (id: string) => {
    setSeen((prev) => ({
      ...prev,
      [selectedId]: countOf(selectedId),
      [id]: countOf(id),
    }))
    setSelectedId(id)
  }

  // rola para a última mensagem
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [visible.length, selectedId])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'NOTE') {
      if (!text.trim()) return
      onNote(selectedId, text.trim(), OPERATOR)
    } else {
      onSend({
        satelliteId: selectedId,
        code,
        params: text.trim(),
        priority,
        operator: OPERATOR,
      })
    }
    setText('')
  }

  return (
    <div className='grid h-[680px] grid-cols-1 overflow-hidden rounded-xl border bg-card md:grid-cols-[230px_1fr]'>
      {/* ===== Canais ===== */}
      <aside className='flex gap-1 overflow-x-auto border-b p-2 md:flex-col md:overflow-y-auto md:border-e md:border-b-0'>
        <p className='hidden px-2 pt-1 pb-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase md:block'>
          Canais
        </p>
        {satellites.map((s) => {
          const total = messages.filter((m) => m.satelliteId === s.id)
          const unread = Math.max(0, total.length - (seen[s.id] ?? 0))
          const last = total[total.length - 1]
          const active = s.id === selectedId
          return (
            <button
              key={s.id}
              type='button'
              onClick={() => openChannel(s.id)}
              className={cn(
                'min-w-[150px] shrink-0 rounded-lg px-3 py-2 text-start transition-colors md:min-w-0',
                active ? 'bg-muted' : 'hover:bg-muted/50'
              )}
            >
              <div className='flex items-center justify-between gap-2'>
                <span className='flex items-center gap-2 text-sm font-semibold'>
                  <span
                    className='size-2 rounded-full'
                    style={{ backgroundColor: statusColor[s.status] }}
                  />
                  {s.name}
                </span>
                {unread > 0 && !active && (
                  <span className='rounded-full bg-sky-500 px-1.5 font-mono text-[10px] text-white'>
                    {unread}
                  </span>
                )}
              </div>
              <p className='mt-0.5 truncate text-xs text-muted-foreground'>
                {last ? `${last.code} · ${last.content}` : 'Sem mensagens'}
              </p>
            </button>
          )
        })}
      </aside>

      {/* ===== Conversa ===== */}
      <section className='flex min-h-0 flex-col'>
        <header className='flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3'>
          <div>
            <div className='flex items-center gap-2'>
              <span className='font-semibold'>{sat.name}</span>
              <span className='font-mono text-xs text-muted-foreground'>
                {sat.id}
              </span>
              <StatusPill label={sat.status} color={statusColor[sat.status]} />
            </div>
            <p className='font-mono text-[11px] text-muted-foreground'>
              {station ? (
                <>
                  ENLACE{' '}
                  <span className='text-emerald-500'>
                    {stationById(station).name}
                  </span>{' '}
                  · BANDA {sat.band}
                </>
              ) : (
                <span className='text-red-500'>
                  SEM ENLACE · último contato {sat.lastContact}
                </span>
              )}
            </p>
          </div>
          <div className='flex gap-1'>
            {filters.map((f) => (
              <button
                key={f.value}
                type='button'
                onClick={() => setFilter(f.value)}
                className={cn(
                  'rounded-md px-2 py-1 font-mono text-[11px] tracking-wider uppercase',
                  filter === f.value
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <div className='flex-1 space-y-2 overflow-y-auto bg-muted/10 px-4 py-4 font-mono text-[13px]'>
          {visible.length === 0 && (
            <p className='py-10 text-center text-xs text-muted-foreground'>
              Nenhuma mensagem neste filtro.
            </p>
          )}
          {visible.map((m) => (
            <MessageRow key={m.id} msg={m} onRetry={onRetry} />
          ))}
          <div ref={endRef} />
        </div>

        {/* ===== Compositor ===== */}
        <form onSubmit={submit} className='space-y-2 border-t p-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='flex rounded-md border p-0.5'>
              <ModeButton
                active={mode === 'CMD'}
                onClick={() => setMode('CMD')}
              >
                <TerminalSquare className='size-3.5' /> Telecomando
              </ModeButton>
              <ModeButton
                active={mode === 'NOTE'}
                onClick={() => setMode('NOTE')}
              >
                <StickyNote className='size-3.5' /> Nota
              </ModeButton>
            </div>
            {mode === 'CMD' && (
              <>
                <Select
                  value={code}
                  onValueChange={(v) => setCode(v as CommandCode)}
                >
                  <SelectTrigger
                    size='sm'
                    className='w-[230px] font-mono text-xs'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commands.map((c) => (
                      <SelectItem
                        key={c.code}
                        value={c.code}
                        className='text-xs'
                      >
                        <span className='font-mono'>{c.code}</span>
                        <span className='text-muted-foreground'>
                          — {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as Priority)}
                >
                  <SelectTrigger
                    size='sm'
                    className='w-[120px] font-mono text-xs'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['NORMAL', 'ALTA', 'CRÍTICA'] as const).map((p) => (
                      <SelectItem
                        key={p}
                        value={p}
                        className='font-mono text-xs'
                      >
                        <span
                          className='size-2 rounded-full'
                          style={{ backgroundColor: priorityColor[p] }}
                        />
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            {!station && mode === 'CMD' && (
              <span className='flex items-center gap-1 font-mono text-[11px] text-amber-500'>
                <WifiOff className='size-3.5' /> será enfileirado
              </span>
            )}
          </div>
          <div className='flex gap-2'>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                mode === 'CMD'
                  ? 'Parâmetros (opcional) — ex.: Δv=0.12 m/s, órbita 4413'
                  : `Nota para a equipe sobre ${sat.name}…`
              }
              className='font-mono text-sm'
            />
            <Button type='submit' disabled={mode === 'NOTE' && !text.trim()}>
              <Send className='size-4' />
              <span className='hidden sm:inline'>
                {mode === 'CMD' ? 'Transmitir' : 'Registrar'}
              </span>
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs',
        active
          ? 'bg-muted font-medium text-foreground'
          : 'text-muted-foreground'
      )}
    >
      {children}
    </button>
  )
}

function MessageRow({
  msg,
  onRetry,
}: {
  msg: CommMessage
  onRetry: (m: CommMessage) => void
}) {
  if (msg.direction === 'NOTE') {
    return (
      <div className='rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 font-sans'>
        <div className='flex items-center gap-2 font-mono text-[11px] text-amber-600 dark:text-amber-400'>
          <StickyNote className='size-3.5' />
          NOTA · {msg.operator} · {formatUtc(msg.time)} UTC
        </div>
        <p className='mt-1 text-sm'>{msg.content}</p>
      </div>
    )
  }

  const up = msg.direction === 'UP'
  const Icon = up ? ArrowUpRight : ArrowDownLeft
  const isAlert = msg.code === 'ALERTA'

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40',
        isAlert && 'bg-red-500/5'
      )}
    >
      <span className='w-[62px] shrink-0 pt-0.5 text-[11px] text-muted-foreground tabular-nums'>
        {formatUtc(msg.time)}
      </span>
      <Icon
        className={cn(
          'mt-0.5 size-4 shrink-0',
          up ? 'text-sky-500' : 'text-emerald-500'
        )}
        aria-label={up ? 'Uplink' : 'Downlink'}
      />
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <span className={cn('font-semibold', isAlert && 'text-red-500')}>
            {msg.code}
          </span>
          <span className='break-words text-foreground/80'>{msg.content}</span>
        </div>
        <div className='mt-0.5 flex flex-wrap gap-x-3 text-[10px] text-muted-foreground'>
          {msg.stationId && <span>via {stationById(msg.stationId).name}</span>}
          {msg.operator && <span>op. {msg.operator}</span>}
          {msg.priority && msg.priority !== 'NORMAL' && (
            <span style={{ color: priorityColor[msg.priority] }}>
              prioridade {msg.priority}
            </span>
          )}
        </div>
      </div>
      {up && (
        <div className='flex shrink-0 items-center gap-1'>
          {msg.status === 'FALHA' && (
            <Button
              size='sm'
              variant='ghost'
              className='h-6 px-1.5 text-[11px]'
              onClick={() => onRetry(msg)}
            >
              <RotateCcw className='size-3' /> Reenviar
            </Button>
          )}
          <StatusPill
            label={msg.status}
            color={messageStatusColor[msg.status]}
            pulse={msg.status === 'PENDENTE' || msg.status === 'ENVIADO'}
          />
        </div>
      )}
    </div>
  )
}
