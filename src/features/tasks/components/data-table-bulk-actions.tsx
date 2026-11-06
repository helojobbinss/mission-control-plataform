import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { CircleArrowUp, ArrowUpDown, Download, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { priorities, statuses } from '../data/data'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { bulkMissions } from '../data/api'
import { useReopenConfirmation } from './reopen-confirmation'
import { type Task } from '../data/schema'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pending, setPending] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const queryClient = useQueryClient()
  const { requestConfirmation, dialog } = useReopenConfirmation()
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const containsCompleted = selectedRows.some((row) => (row.original as Task).status === 'Concluída')


  const runBulk = async (action: 'status' | 'operator' | 'delete', value?: string) => {
    const ids = selectedRows.map((row) => (row.original as Task).id)
    if (ids.length === 0 || pending) return
    let confirmation: string | undefined = action === 'delete' ? deleteConfirmation || undefined : undefined
    if (action === 'status' && selectedRows.some((row) => {
      const task = row.original as Task
      return ['Concluída', 'Abortada'].includes(task.status) && task.status !== value
    })) {
      confirmation = await requestConfirmation()
      if (!confirmation) return
    }
    setPending(true)
    try {
      await bulkMissions(ids, action, value, confirmation)
      table.resetRowSelection()
      setShowDeleteConfirm(false)
      setDeleteConfirmation('')
      await queryClient.invalidateQueries({ queryKey: ['missions'] })
      toast.success(action === 'delete' ? 'Missões excluídas.' : 'Missões atualizadas.')
    } catch {
      toast.error('Não foi possível concluir. Atualize a lista e tente novamente.')
      await queryClient.invalidateQueries({ queryKey: ['missions'] })
    } finally {
      setPending(false)
    }
  }
  const handleBulkExport = () => toast.info('Exportação ainda não implementada.')

  return (
    <>
      {dialog}
      <BulkActionsToolbar table={table} entityName='task'>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  aria-label='Update status'
                  title='Update status'
                  disabled={pending}
                >
                  <CircleArrowUp />
                  <span className='sr-only'>Atualizar status</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Atualizar status</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {statuses.map((status) => (
              <DropdownMenuItem
                key={status.value}
                defaultValue={status.value}
                onClick={() => runBulk('status', status.value)}
              >
                {status.icon && (
                  <status.icon className='size-4 text-muted-foreground' />
                )}
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  aria-label='Update Operador'
                  title='Update Operador'
                  disabled={pending}
                >
                  <ArrowUpDown />
                  <span className='sr-only'>Atualizar Operador</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Atualizar Operador</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {priorities.map((Operador) => (
              <DropdownMenuItem
                key={Operador.value}
                defaultValue={Operador.value}
                onClick={() => runBulk('operator', Operador.value)}
              >
                {Operador.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkExport()}
              className='size-8'
              aria-label='Export tasks'
              title='Export tasks'
            >
              <Download />
              <span className='sr-only'>Exportar missões</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Exportar missões</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild><Button variant='outline' size='icon' className='size-8' aria-label='Excluir selecionadas' disabled={pending} onClick={() => setShowDeleteConfirm(true)}><Trash2 /></Button></TooltipTrigger>
          <TooltipContent>
            <p>Excluir missões selecionadas</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => { setShowDeleteConfirm(open); if (!open) setDeleteConfirmation('') }}
        title='Excluir missões selecionadas?'
        desc={`As ${selectedRows.length} missões selecionadas e seus comentários serão excluídos permanentemente.`}
        confirmText='Excluir'
        destructive
        isLoading={pending}
        disabled={containsCompleted && deleteConfirmation !== 'ciente'}
        handleConfirm={() => runBulk('delete')}
      >
        {containsCompleted && <div className='space-y-2 rounded-lg border bg-muted/40 p-4'><label htmlFor='bulk-delete-confirmation'>Há missões concluídas. Digite <strong>ciente</strong> para excluir.</label><input id='bulk-delete-confirmation' className='border-input bg-background w-full rounded-md border px-3 py-2' value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete='off' placeholder='ciente' /></div>}
      </ConfirmDialog>
    </>
  )
}
