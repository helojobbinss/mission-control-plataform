import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { statuses } from '../data/data'
import { type Task } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import { MissionDetails } from './mission-details'

function MissionTitle({ task }: { task: Task }) {
  const [open, setOpen] = useState(false)
  return <div className='flex flex-col items-start'><button type='button' className='text-left font-medium hover:underline' onClick={() => setOpen(true)}>{task.title}</button>{open && <MissionDetails mission={task} onClose={() => setOpen(false)} />}</div>
}

export const tasksColumns: ColumnDef<Task>[] = [
  {
    id: 'select',
    header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label='Selecionar todas' />,
    cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label='Selecionar missão' />,
    enableSorting: false, enableHiding: false,
  },
  { accessorKey: 'id', header: 'ID', enableHiding: true },
  { accessorKey: 'title', header: ({ column }) => <DataTableColumnHeader column={column} title='Missão' />, cell: ({ row }) => <MissionTitle task={row.original} /> },
  { accessorKey: 'satellite_name', header: 'Satélite', cell: ({ row }) => row.original.satellite_name ? <Badge variant='outline' className='border-2 border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300'>{row.original.satellite_name}</Badge> : '—' },
  { accessorKey: 'label', header: 'Tipo', cell: ({ row }) => { const label = row.original.label; const names: Record<string, string> = { AnaliseOrbital: 'Análise Orbital', Comunicacao: 'Comunicação', Monitoramento: 'Monitoramento' }; return label ? <Badge variant='outline' className='border-sky-500/60 text-sky-600 dark:text-sky-300'>{names[label] ?? label}</Badge> : '—' } },
  { accessorKey: 'description', header: 'Descrição', cell: ({ row }) => <span className='block max-w-48 truncate' title={row.original.description || ''}>{row.original.description || '—'}</span> },
  { accessorKey: 'Operador', header: ({ column }) => <DataTableColumnHeader column={column} title='Operador' />, cell: ({ row }) => row.original.Operador || '—', filterFn: (row, id, value) => value.includes(row.getValue(id)) },
  { accessorKey: 'budget', header: 'Orçamento', cell: ({ row }) => row.original.budget ? Number(row.original.budget).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—' },
  { id: 'period', header: 'Período planejado', cell: ({ row }) => { const format = (value?: string) => value ? value.split('-').reverse().join('/') : '—'; return <span className='whitespace-nowrap'>{format(row.original.planned_start_date)} – {format(row.original.planned_end_date)}</span> } },
  { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />, cell: ({ row }) => { const status = statuses.find((item) => item.value === row.original.status); return status ? <div className='flex items-center gap-2'>{status.icon && <status.icon className='size-4 text-muted-foreground' />}<span>{status.label}</span></div> : row.original.status }, filterFn: (row, id, value) => value.includes(row.getValue(id)) },
  { id: 'actions', header: 'Ações', cell: ({ row }) => <DataTableRowActions row={row} /> },
]
