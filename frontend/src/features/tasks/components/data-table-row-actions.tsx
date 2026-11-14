import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { transitionMission } from '../data/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { taskSchema } from '../data/schema'
import { useTasks } from './tasks-provider'

type DataTableRowActionsProps<TData> = {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const task = taskSchema.parse(row.original)

  const { setOpen, setCurrentRow } = useTasks()
  const [action, setAction] = useState<'start' | 'complete' | 'abort' | null>(null)
  const queryClient = useQueryClient()
  const transition = useMutation({
    mutationFn: (next: 'start' | 'complete' | 'abort') => transitionMission(task.id, next),
    onSuccess: async () => { setAction(null); await queryClient.invalidateQueries({ queryKey: ['missions'] }); toast.success('Status da missão atualizado.') },
    onError: async () => { toast.error('A ação não pôde ser realizada. Atualize a lista.'); await queryClient.invalidateQueries({ queryKey: ['missions'] }) },
  })

  return (
    <>
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        {task.status === 'Agendada' && <DropdownMenuItem onClick={() => setAction('start')}>Iniciar missão</DropdownMenuItem>}
        {task.status === 'Ativa' && <DropdownMenuItem onClick={() => setAction('complete')}>Concluir missão</DropdownMenuItem>}
        {['Agendada', 'Ativa'].includes(task.status) && <DropdownMenuItem onClick={() => setAction('abort')}>Abortar missão</DropdownMenuItem>}
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(task)
            setOpen('update')
          }}
        >
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setCurrentRow(task); setOpen('delete') }}>
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <ConfirmDialog open={action !== null} onOpenChange={(open) => { if (!open && !transition.isPending) setAction(null) }}
      title={action === 'start' ? 'Iniciar missão?' : action === 'complete' ? 'Concluir missão?' : 'Abortar missão?'}
      desc={`Confirme a ação para a missão ${task.title}.`} confirmText='Confirmar' isLoading={transition.isPending}
      destructive={action === 'abort'} handleConfirm={() => { if (action) transition.mutate(action) }} />
    </>
  )
}
