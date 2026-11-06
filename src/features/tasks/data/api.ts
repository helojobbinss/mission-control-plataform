import axios from 'axios'
import { type Task } from './schema'

type Mission = {
  id: number
  satellite_id: number
  satellite: { id: number; name: string; norad_id: number } | null
  name: string
  description: string | null
  status: string
  category: string | null
  operator_name: string | null
  budget: string | null
  planned_start_date: string | null
  planned_end_date: string | null
  started_at: string | null
  ended_at: string | null
}

export type MissionInput = Pick<Task, 'title' | 'status' | 'label' | 'Operador'> & { satellite_id: string; description?: string; planned_start_date?: string; planned_end_date?: string; budget?: string }

const toTask = (m: Mission): Task => ({
  id: String(m.id), title: m.name, status: m.status,
  satellite_id: m.satellite_id, satellite_name: m.satellite?.name ?? '',
  label: m.category ?? '', Operador: m.operator_name ?? '', description: m.description ?? '',
  budget: m.budget ?? '',
  planned_start_date: m.planned_start_date ?? '', planned_end_date: m.planned_end_date ?? '', started_at: m.started_at, ended_at: m.ended_at,
})

export async function listMissions(): Promise<Task[]> {
  const response = await axios.get<Mission[]>('/api/missions')
  return response.data.map(toTask)
}

export async function saveMission(data: MissionInput, id?: string, confirmation?: string): Promise<void> {
  const payload = { name: data.title, satellite_id: Number(data.satellite_id), description: data.description || null, status: data.status, category: data.label, operator_name: data.Operador, budget: data.budget?.trim().replace(',', '.') || null, planned_start_date: data.planned_start_date || null, planned_end_date: data.planned_end_date || null, confirmation }
  if (id) await axios.put(`/api/missions/${id}`, payload)
  else await axios.post('/api/missions', payload)
}

export async function transitionMission(id: string, action: 'start' | 'complete' | 'abort'): Promise<void> {
  await axios.post(`/api/missions/${id}/transition`, { action })
}

export async function bulkMissions(ids: string[], action: 'status' | 'operator' | 'delete', value?: string, confirmation?: string): Promise<void> {
  await axios.post('/api/missions/bulk', { ids: ids.map(Number), action, value, confirmation })
}
