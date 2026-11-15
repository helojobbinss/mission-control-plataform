import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { appendTelemetrySample } from './telemetry-history'

export type RegisteredSatellite = {
  id: number
  name: string
  norad_id: number | null
  source: 'manual' | 'celestrak'
  status: string
  missions: { id: number; name: string; status: string }[]
  orbit: {
    altitude_km: number
    inclination_deg: number
    raan_deg: number
    initial_anomaly_deg: number
    epoch: string
  } | null
}

// Não usar next_page_url fornecido pelo servidor: pode conter uma origem interna.
export async function listSatellites(): Promise<RegisteredSatellite[]> {
  const satellites: RegisteredSatellite[] = []
  let page = 1
  let lastPage: number
  do {
    const { data } = await api.get<{
      data: RegisteredSatellite[]
      last_page: number
    }>('/api/satellites', { params: { page, per_page: 100 } })
    satellites.push(...data.data)
    lastPage = data.last_page
    page++
  } while (page <= lastPage)
  return satellites
}

export type Position = {
  latitude: number
  longitude: number
  altitude_km: number
  orbital_speed_km_s: number
}
export type Telemetry = {
  simulated: boolean
  timestamp: string
  sensors: Record<
    string,
    { value: number | string; unit: string; status: string }
  >
  orbital_position: Position | null
  alerts: { code: string; severity: string; message: string }[]
}

export function useTelemetry(satelliteId?: number) {
  const client = useQueryClient()
  return useQuery({
    queryKey: ['telemetry', satelliteId],
    enabled: satelliteId !== undefined,
    queryFn: async ({ signal }) => {
      const { data } = await api.get<Telemetry>(
        `/api/satellites/${satelliteId}/monitoring/telemetry`,
        { signal }
      )
      client.setQueryData<Telemetry[]>(
        ['telemetry-history', satelliteId],
        (previous) => appendTelemetrySample(previous, data)
      )
      return data
    },
    refetchInterval: 60000,
    retry: false,
  })
}

export function useTelemetrySamples(satelliteId: number) {
  return (
    useQuery<Telemetry[]>({
      queryKey: ['telemetry-history', satelliteId],
      queryFn: skipToken,
      initialData: [],
      gcTime: 30 * 60 * 1000,
    }).data ?? []
  )
}
