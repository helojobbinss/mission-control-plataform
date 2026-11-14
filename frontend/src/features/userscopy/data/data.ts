import { BriefcaseBusiness, Headset, ScanSearch } from 'lucide-react'
import { type UserStatus } from './schema'

export const callTypes = new Map<UserStatus, string>([
  ['ativo', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inativo', 'bg-neutral-300/40 border-neutral-300'],
  [
    'Suspenso',
    'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10',
  ],
])

export const roles = [
  {
    label: 'Gerente',
    value: 'Gerente',
    icon: BriefcaseBusiness,
  },
  {
    label: 'operador',
    value: 'operador',
    icon: Headset,
  },
  {
    label: 'analista_dados',
    value: 'analista_dados',
    icon: ScanSearch,
  },

] as const
