import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTasks } from './tasks-provider'

export function TasksPrimaryButtons() {
  const { setOpen } = useTasks()
  return (
    <div className='flex gap-2'>
      <Button
        className='space-x-1 bg-sky-200'
        onClick={() => setOpen('create')}
      >
        <Plus size={18} /> <span>Nova Missão</span>
      </Button>
    </div>
  )
}
