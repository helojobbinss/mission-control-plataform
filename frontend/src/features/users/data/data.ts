import { UserRoundX, CheckCheck, CircleCheck, Eye } from 'lucide-react'
import { type UserStatus } from './schema'

export const callTypes = new Map<UserStatus, string>([
  ['info', 'bg-blue-500/20 text-blue-300 border-blue-500'],
  ['aviso', 'bg-yellow-400/25 text-yellow-300 border-yellow-400'],
  ['critico', 'bg-red-500/25 text-red-300 border-red-500'],
  ['reconhecido', 'bg-gray-500/20 text-gray-300 border-gray-500/40',],
])

export const roles = [
  {
    label: 'naoreconhecido',
    value: 'naoreconhecido',
    icon: UserRoundX,
  },
  {
    label: 'Fechado',
    value: 'Fechado',
    icon: CheckCheck,
  },
  {
    label: 'Reconhecido',
    value: 'Reconhecido',
    icon: CircleCheck,
  },
  {
    label: 'Observacao',
    value: 'Observacao',
    icon: Eye,
  },
] as const
