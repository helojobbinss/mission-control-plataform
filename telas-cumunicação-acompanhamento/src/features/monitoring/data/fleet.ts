/**
 * Dados simulados da frota (satélites + estações terrestres).
 * Compartilhado entre as telas de Acompanhamento e Comunicações.
 * Quando houver API, substituir por chamadas (React Query) mantendo os tipos.
 */

export type SatelliteStatus =
  'OPERACIONAL' | 'DEGRADADO' | 'CRÍTICO' | 'OFFLINE'

export type OrbitType = 'LEO' | 'MEO' | 'GEO'

export type Satellite = {
  id: string
  name: string
  status: SatelliteStatus
  orbit: OrbitType
  /** Altitude média em km (null = sem telemetria) */
  altitude: number | null
  /** Inclinação orbital em graus */
  inclination: number
  /** Fase inicial na órbita (rad) – só para a simulação */
  phase: number
  /** Valores base de telemetria */
  baseSignal: number
  baseBattery: number
  baseTemp: number
  band: 'S' | 'X' | 'Ka' | 'UHF'
  mission: string
  operator: string
  lastContact: string
}

export const statusColor: Record<SatelliteStatus, string> = {
  OPERACIONAL: '#10dba4',
  DEGRADADO: '#fbbf24',
  CRÍTICO: '#ff5263',
  OFFLINE: '#64748b',
}

export const satellites: Satellite[] = [
  {
    id: 'SAT-001',
    name: 'SERPENS',
    status: 'OPERACIONAL',
    orbit: 'LEO',
    altitude: 412,
    inclination: 51.6,
    phase: 0.4,
    baseSignal: 94,
    baseBattery: 87,
    baseTemp: 21,
    band: 'UHF',
    mission: 'Coleta de dados ambientais',
    operator: 'Gabriel',
    lastContact: '22:51 UTC',
  },
  {
    id: 'SAT-002',
    name: 'SGDC',
    status: 'DEGRADADO',
    orbit: 'LEO',
    altitude: 523,
    inclination: 97.4,
    phase: 2.1,
    baseSignal: 61,
    baseBattery: 43,
    baseTemp: 34,
    band: 'Ka',
    mission: 'Comunicação de defesa',
    operator: 'Sophia',
    lastContact: '22:48 UTC',
  },
  {
    id: 'SAT-003',
    name: 'ITASat',
    status: 'OPERACIONAL',
    orbit: 'LEO',
    altitude: 705,
    inclination: 98.2,
    phase: 4.0,
    baseSignal: 88,
    baseBattery: 92,
    baseTemp: 18,
    band: 'S',
    mission: 'Demonstração tecnológica',
    operator: 'Isabella',
    lastContact: '22:52 UTC',
  },
  {
    id: 'SAT-004',
    name: 'TRACERS',
    status: 'CRÍTICO',
    orbit: 'MEO',
    altitude: 20200,
    inclination: 55,
    phase: 5.3,
    baseSignal: 22,
    baseBattery: 18,
    baseTemp: 47,
    band: 'X',
    mission: 'Estudo da magnetosfera',
    operator: 'Arthur',
    lastContact: '22:39 UTC',
  },
  {
    id: 'SAT-005',
    name: 'TES-22',
    status: 'OFFLINE',
    orbit: 'LEO',
    altitude: null,
    inclination: 63.4,
    phase: 1.2,
    baseSignal: 0,
    baseBattery: 0,
    baseTemp: -12,
    band: 'S',
    mission: 'Observação da Terra',
    operator: 'Gabriel',
    lastContact: '06 Out · 14:02 UTC',
  },
  {
    id: 'SAT-006',
    name: 'REAL',
    status: 'OPERACIONAL',
    orbit: 'GEO',
    altitude: 35786,
    inclination: 0.1,
    phase: 3.0,
    baseSignal: 97,
    baseBattery: 95,
    baseTemp: 23,
    band: 'Ka',
    mission: 'Retransmissão de dados',
    operator: 'Sophia',
    lastContact: '22:53 UTC',
  },
]

export type StationStatus = 'ONLINE' | 'MANUTENÇÃO' | 'OFFLINE'

export type GroundStation = {
  id: string
  name: string
  location: string
  status: StationStatus
  bands: string[]
  antenna: string
  uptime: number
}

export const stationColor: Record<StationStatus, string> = {
  ONLINE: '#10dba4',
  MANUTENÇÃO: '#fbbf24',
  OFFLINE: '#ff5263',
}

export const groundStations: GroundStation[] = [
  {
    id: 'GS-CBA',
    name: 'Cuiabá',
    location: 'MT · -15.55, -56.07',
    status: 'ONLINE',
    bands: ['S', 'X'],
    antenna: 'Parabólica 11 m',
    uptime: 99.7,
  },
  {
    id: 'GS-ALC',
    name: 'Alcântara',
    location: 'MA · -2.37, -44.39',
    status: 'ONLINE',
    bands: ['S', 'Ka'],
    antenna: 'Parabólica 9 m',
    uptime: 98.9,
  },
  {
    id: 'GS-NAT',
    name: 'Natal',
    location: 'RN · -5.92, -35.16',
    status: 'ONLINE',
    bands: ['UHF', 'S'],
    antenna: 'Yagi cruzada + 3,7 m',
    uptime: 99.2,
  },
  {
    id: 'GS-SMA',
    name: 'Santa Maria',
    location: 'RS · -29.71, -53.84',
    status: 'MANUTENÇÃO',
    bands: ['S', 'X'],
    antenna: 'Parabólica 7,3 m',
    uptime: 0,
  },
]

/** Qual estação está atendendo cada satélite agora (null = sem enlace). */
export const activeLinks: Record<string, string | null> = {
  'SAT-001': 'GS-NAT',
  'SAT-002': 'GS-ALC',
  'SAT-003': 'GS-CBA',
  'SAT-004': 'GS-CBA',
  'SAT-005': null,
  'SAT-006': 'GS-ALC',
}

// ---------------------------------------------------------------------------
// Física simplificada para a simulação
// ---------------------------------------------------------------------------

const EARTH_RADIUS = 6371 // km
const MU = 398600.4418 // km³/s²

export function orbitalVelocity(altitude: number) {
  return Math.sqrt(MU / (EARTH_RADIUS + altitude))
}

/** Período orbital em minutos */
export function orbitalPeriod(altitude: number) {
  const r = EARTH_RADIUS + altitude
  return (2 * Math.PI * Math.sqrt(r ** 3 / MU)) / 60
}

/** Ruído determinístico, para os valores "andarem" de forma suave. */
function wave(t: number, seed: number) {
  return (
    Math.sin(t / 7 + seed) * 0.6 +
    Math.sin(t / 3.1 + seed * 2) * 0.3 +
    Math.sin(t / 1.3 + seed * 5) * 0.1
  )
}

export type Telemetry = {
  signal: number
  battery: number
  temperature: number
  altitude: number | null
  velocity: number | null
  /** taxa de dados de downlink em Mbps */
  dataRate: number
  /** relação sinal-ruído em dB */
  snr: number
  /** latência em ms */
  latency: number
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

export function telemetryAt(sat: Satellite, t: number): Telemetry {
  if (sat.status === 'OFFLINE' || sat.altitude === null) {
    return {
      signal: 0,
      battery: 0,
      temperature: sat.baseTemp,
      altitude: null,
      velocity: null,
      dataRate: 0,
      snr: 0,
      latency: 0,
    }
  }
  const seed = sat.phase * 10
  const signal = clamp(sat.baseSignal + wave(t, seed) * 4, 0, 100)
  const battery = clamp(sat.baseBattery + wave(t / 4, seed + 1) * 1.5, 0, 100)
  const temperature = sat.baseTemp + wave(t, seed + 2) * 2.5
  const altitude = sat.altitude + wave(t / 2, seed + 3) * 0.8
  const bandRate = { UHF: 0.0096, S: 2, X: 150, Ka: 600 }[sat.band]
  const dataRate = Math.max(0, bandRate * (signal / 100))
  const snr = clamp(signal / 4 + wave(t, seed + 4), 0, 30)
  // propagação ida e volta + processamento
  const latency = ((sat.altitude * 2) / 299792) * 1000 + 18 + wave(t, seed) * 3

  return {
    signal,
    battery,
    temperature,
    altitude,
    velocity: orbitalVelocity(sat.altitude),
    dataRate,
    snr,
    latency,
  }
}

/** Ângulo atual do satélite na órbita (rad). `speedUp` acelera a animação. */
export function orbitalAngle(sat: Satellite, t: number, speedUp = 60) {
  if (sat.altitude === null) return sat.phase
  const periodSec = orbitalPeriod(sat.altitude) * 60
  return sat.phase + (2 * Math.PI * t * speedUp) / periodSec
}

// ---------------------------------------------------------------------------
// Passagens previstas sobre as estações
// ---------------------------------------------------------------------------

export type Pass = {
  satelliteId: string
  stationId: string
  /** minutos a partir de agora */
  aosIn: number
  durationMin: number
  maxElevation: number
}

export const upcomingPasses: Pass[] = [
  {
    satelliteId: 'SAT-003',
    stationId: 'GS-NAT',
    aosIn: 6,
    durationMin: 11,
    maxElevation: 64,
  },
  {
    satelliteId: 'SAT-001',
    stationId: 'GS-CBA',
    aosIn: 14,
    durationMin: 8,
    maxElevation: 37,
  },
  {
    satelliteId: 'SAT-002',
    stationId: 'GS-CBA',
    aosIn: 23,
    durationMin: 10,
    maxElevation: 52,
  },
  {
    satelliteId: 'SAT-004',
    stationId: 'GS-ALC',
    aosIn: 41,
    durationMin: 96,
    maxElevation: 71,
  },
  {
    satelliteId: 'SAT-003',
    stationId: 'GS-ALC',
    aosIn: 58,
    durationMin: 9,
    maxElevation: 28,
  },
  {
    satelliteId: 'SAT-001',
    stationId: 'GS-NAT',
    aosIn: 77,
    durationMin: 7,
    maxElevation: 19,
  },
]

export const satById = (id: string) => satellites.find((s) => s.id === id)!
export const stationById = (id: string) =>
  groundStations.find((g) => g.id === id)!
