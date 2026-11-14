import { createFileRoute } from '@tanstack/react-router'
import { Communications } from '@/features/communications'

export const Route = createFileRoute('/_authenticated/comunicacoes/')({
  component: Communications,
})
