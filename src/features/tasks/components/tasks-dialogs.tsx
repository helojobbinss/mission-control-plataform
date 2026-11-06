import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { bulkMissions } from '../data/api'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TasksMutateDrawer } from './tasks-mutate-drawer'
import { useTasks } from './tasks-provider'

export function TasksDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useTasks()
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const queryClient = useQueryClient()
  return (
    <>
      <TasksMutateDrawer
        key='task-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      {currentRow && (
        <>
          <TasksMutateDrawer
            key={`task-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            key='task-delete'
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              setDeleteConfirmation('')
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            isLoading={deleting}
            disabled={currentRow.status === 'Concluída' && deleteConfirmation !== 'ciente'}
            handleConfirm={async () => {
              if (deleting) return
              setDeleting(true)
              try {
                await bulkMissions([currentRow.id], 'delete', undefined, deleteConfirmation || undefined)
                await queryClient.invalidateQueries({ queryKey: ['missions'] })
                setOpen(null)
                setCurrentRow(null)
                setDeleteConfirmation('')
                toast.success('Missão excluída.')
              } catch {
                toast.error('Não foi possível excluir a missão.')
              } finally { setDeleting(false) }
            }}
            className='max-w-md'
            title={`Excluir missão ${currentRow.id}?`}
            desc='A missão e todos os seus comentários serão excluídos permanentemente.'
            confirmText='Excluir'
          >
            {currentRow.status === 'Concluída' && <div className='space-y-2 rounded-lg border bg-muted/40 p-4'><Label htmlFor='delete-mission-confirmation'>Esta missão está concluída. Digite <strong>ciente</strong> para excluir.</Label><Input id='delete-mission-confirmation' value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete='off' placeholder='ciente' /></div>}
          </ConfirmDialog>
        </>
      )}
    </>
  )
}
