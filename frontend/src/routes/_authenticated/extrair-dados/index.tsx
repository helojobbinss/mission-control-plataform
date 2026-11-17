import { createFileRoute } from '@tanstack/react-router'
import { DataExports } from '@/features/exports'

export const Route = createFileRoute('/_authenticated/extrair-dados/')({
  component: DataExports,
})
