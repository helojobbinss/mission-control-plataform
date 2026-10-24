import { Circle, CheckCircle, Timer, CircleOff } from 'lucide-react'

export const labels = [
  {
    value: 'Monitoramento',
    label: 'Monitoramento',
  },
  {
    value: 'Comunicacao',
    label: 'Comunicacao',
  },
  {
    value: 'AnaliseOrbital',
    label: 'AnaliseOrbital',
    color: 'text-sky-300',
  },
]

export const statuses = [
  {
    label: 'Ativa',
    value: 'Ativa' as const,
    icon: Circle,
  },
  {
    label: 'Agendada',
    value: 'Agendada' as const,
    icon: Timer,
  },
  {
    label: 'Concluída',
    value: 'Concluída' as const,
    icon: CheckCircle,
  },
  {
    label: 'Abortada',
    value: 'Abortada' as const,
    icon: CircleOff,
  },
]

export const priorities = [
  {
    label: 'Gabriel',
    value: 'Gabriel' as const,
  },
  {
    label: 'Sophia',
    value: 'Sophia' as const,
  },
  {
    label: 'Isabella',
    value: 'Isabella' as const,
  },
  {
    label: 'Arthur',
    value: 'Arthur' as const,
  },
]
