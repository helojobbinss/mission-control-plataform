import { useEffect, useRef, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function useReopenConfirmation() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const resolve = useRef<((value: string | undefined) => void) | null>(null)

  useEffect(() => () => { resolve.current?.(undefined); resolve.current = null }, [])

  const finish = (confirmed: boolean) => {
    resolve.current?.(confirmed ? 'ciente' : undefined)
    resolve.current = null
    setOpen(false)
    setValue('')
  }

  const requestConfirmation = () => new Promise<string | undefined>((done) => {
    resolve.current?.(undefined)
    resolve.current = done
    setValue('')
    setOpen(true)
  })

  const dialog = (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => { if (!next) finish(false) }}
      title={<span className='flex items-center gap-2'><TriangleAlert className='size-5 text-amber-500' /> Alterar missão encerrada</span>}
      desc='Você está alterando o status de uma missão concluída ou abortada. Está ciente?'
      confirmText='Confirmar alteração'
      cancelBtnText='Cancelar'
      disabled={value !== 'ciente'}
      handleConfirm={() => finish(true)}
    >
      <div className='space-y-2 rounded-lg border bg-muted/40 p-4'>
        <Label htmlFor='reopen-confirmation'>Digite <strong>ciente</strong> para continuar</Label>
        <Input id='reopen-confirmation' value={value} onChange={(event) => setValue(event.target.value)} autoComplete='off' placeholder='ciente' />
      </div>
    </ConfirmDialog>
  )

  return { requestConfirmation, dialog }
}
