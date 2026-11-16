import { useState } from 'react'
import { type Task } from '../data/schema'
import { MissionDetails } from './mission-details'

export function MissionTitle({ task }: { task: Task }) {
  const [open, setOpen] = useState(false)
  return <div className='flex flex-col items-start'><button type='button' className='text-left font-medium hover:underline' onClick={() => setOpen(true)}>{task.title}</button>{open && <MissionDetails mission={task} onClose={() => setOpen(false)} />}</div>
}
