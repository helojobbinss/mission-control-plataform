/**
 * Dados simulados do canal de comunicação (uplink de telecomandos,
 * downlink de telemetria/respostas e notas de operador).
 */

export type Direction = 'UP' | 'DOWN' | 'NOTE'

export type MessageStatus =
  'PENDENTE' | 'ENVIADO' | 'ACK' | 'FALHA' | 'RECEBIDO' | 'ENFILEIRADO'

export type Priority = 'NORMAL' | 'ALTA' | 'CRÍTICA'

export type CommMessage = {
  id: string
  satelliteId: string
  direction: Direction
  /** Código do comando ou do tipo de pacote (TLM, ACK, BEACON…) */
  code: string
  content: string
  stationId: string | null
  time: Date
  status: MessageStatus
  operator?: string
  priority?: Priority
}

export const messageStatusColor: Record<MessageStatus, string> = {
  PENDENTE: '#94a3b8',
  ENVIADO: '#38bdf8',
  ACK: '#10dba4',
  RECEBIDO: '#10dba4',
  FALHA: '#ff5263',
  ENFILEIRADO: '#fbbf24',
}

export const priorityColor: Record<Priority, string> = {
  NORMAL: '#94a3b8',
  ALTA: '#fbbf24',
  CRÍTICA: '#ff5263',
}

export const commands = [
  { code: 'PING', label: 'Ping / verificação de enlace' },
  { code: 'TLM_REQ', label: 'Solicitar telemetria completa' },
  { code: 'DUMP_DATA', label: 'Descarregar memória de massa' },
  { code: 'MODE_SAFE', label: 'Entrar em modo de segurança' },
  { code: 'MODE_NOMINAL', label: 'Retornar ao modo nominal' },
  { code: 'BATT_SAVE', label: 'Ativar economia de energia' },
  { code: 'PAYLOAD_ON', label: 'Ligar carga útil' },
  { code: 'PAYLOAD_OFF', label: 'Desligar carga útil' },
  { code: 'ORBIT_ADJ', label: 'Ajuste orbital (Δv)' },
  { code: 'REBOOT_OBC', label: 'Reiniciar computador de bordo' },
] as const

export type CommandCode = (typeof commands)[number]['code']

/** Resposta simulada que o satélite devolve após o ACK. */
export const commandReplies: Record<CommandCode, string> = {
  PING: 'PONG · RTT nominal',
  TLM_REQ: 'Pacote de telemetria completo (HK 2,4 kB)',
  DUMP_DATA: 'Iniciando descarga · 128 MB na fila',
  MODE_SAFE: 'Modo SAFE ativo · cargas não essenciais desligadas',
  MODE_NOMINAL: 'Modo NOMINAL ativo',
  BATT_SAVE: 'Economia de energia ativa · consumo −32%',
  PAYLOAD_ON: 'Carga útil ligada · aquecimento em andamento',
  PAYLOAD_OFF: 'Carga útil desligada',
  ORBIT_ADJ: 'Queima programada · aguardando janela',
  REBOOT_OBC: 'OBC reiniciado · boot OK em 14 s',
}

let seq = 0
export const nextId = () =>
  `MSG-${Date.now().toString(36)}-${(seq++).toString(36)}`

const ago = (min: number) => new Date(Date.now() - min * 60_000)

export const initialMessages: CommMessage[] = [
  // SERPENS
  {
    id: 'm1',
    satelliteId: 'SAT-001',
    direction: 'DOWN',
    code: 'BEACON',
    content: 'Beacon nominal · modo NOMINAL · bateria 87%',
    stationId: 'GS-NAT',
    time: ago(22),
    status: 'RECEBIDO',
  },
  {
    id: 'm2',
    satelliteId: 'SAT-001',
    direction: 'UP',
    code: 'DUMP_DATA',
    content: 'Descarregar dados ambientais da órbita 4412',
    stationId: 'GS-NAT',
    time: ago(18),
    status: 'ACK',
    operator: 'Gabriel',
    priority: 'NORMAL',
  },
  {
    id: 'm3',
    satelliteId: 'SAT-001',
    direction: 'DOWN',
    code: 'DATA',
    content: 'Downlink concluído · 48 MB · CRC OK',
    stationId: 'GS-NAT',
    time: ago(3),
    status: 'RECEBIDO',
  },

  // SGDC
  {
    id: 'm4',
    satelliteId: 'SAT-002',
    direction: 'DOWN',
    code: 'ALERTA',
    content: 'Qualidade de sinal abaixo do limiar (61%)',
    stationId: 'GS-ALC',
    time: ago(16),
    status: 'RECEBIDO',
  },
  {
    id: 'm5',
    satelliteId: 'SAT-002',
    direction: 'NOTE',
    code: 'NOTA',
    content:
      'Chuva forte em Alcântara — atenuação na banda Ka esperada até 23:30.',
    stationId: null,
    time: ago(14),
    status: 'RECEBIDO',
    operator: 'Sophia',
  },
  {
    id: 'm6',
    satelliteId: 'SAT-002',
    direction: 'UP',
    code: 'TLM_REQ',
    content: 'Telemetria do subsistema de comunicação',
    stationId: 'GS-ALC',
    time: ago(9),
    status: 'ACK',
    operator: 'Sophia',
    priority: 'ALTA',
  },
  {
    id: 'm7',
    satelliteId: 'SAT-002',
    direction: 'DOWN',
    code: 'TLM',
    content: 'COMMS: TX 18,2 W · RX AGC −92 dBm · antena SEC',
    stationId: 'GS-ALC',
    time: ago(8),
    status: 'RECEBIDO',
  },

  // ITASat
  {
    id: 'm8',
    satelliteId: 'SAT-003',
    direction: 'UP',
    code: 'PAYLOAD_ON',
    content: 'Ativar experimento AIS',
    stationId: 'GS-CBA',
    time: ago(38),
    status: 'ACK',
    operator: 'Isabella',
    priority: 'NORMAL',
  },
  {
    id: 'm9',
    satelliteId: 'SAT-003',
    direction: 'DOWN',
    code: 'BEACON',
    content: 'Beacon nominal · carga útil ON',
    stationId: 'GS-CBA',
    time: ago(1),
    status: 'RECEBIDO',
  },

  // TRACERS
  {
    id: 'm10',
    satelliteId: 'SAT-004',
    direction: 'DOWN',
    code: 'ALERTA',
    content: 'Bateria abaixo de 20% — ação imediata necessária',
    stationId: 'GS-CBA',
    time: ago(14),
    status: 'RECEBIDO',
  },
  {
    id: 'm11',
    satelliteId: 'SAT-004',
    direction: 'UP',
    code: 'BATT_SAVE',
    content: 'Economia de energia emergencial',
    stationId: 'GS-CBA',
    time: ago(12),
    status: 'FALHA',
    operator: 'Arthur',
    priority: 'CRÍTICA',
  },
  {
    id: 'm12',
    satelliteId: 'SAT-004',
    direction: 'NOTE',
    code: 'NOTA',
    content:
      'Sem ACK no primeiro envio. Reenviar na próxima passagem por Alcântara (elev. 71°).',
    stationId: null,
    time: ago(11),
    status: 'RECEBIDO',
    operator: 'Arthur',
  },

  // TES-22
  {
    id: 'm13',
    satelliteId: 'SAT-005',
    direction: 'UP',
    code: 'PING',
    content: 'Tentativa de recuperação de enlace',
    stationId: null,
    time: ago(60 * 5),
    status: 'ENFILEIRADO',
    operator: 'Gabriel',
    priority: 'ALTA',
  },

  // REAL
  {
    id: 'm14',
    satelliteId: 'SAT-006',
    direction: 'DOWN',
    code: 'BEACON',
    content: 'Retransmissão estável · 600 Mbps',
    stationId: 'GS-ALC',
    time: ago(2),
    status: 'RECEBIDO',
  },
]
