import { TriangleAlert, BadgeAlert, MessageSquareWarning } from 'lucide-react'

export function RecentSales() {
  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-4'>
        <TriangleAlert className='h-5 w-5 text-red-500' />
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>
              Nível de bateria abaixo de 20% — ação imediata necessária
            </p>
            <p className='text-sm text-muted-foreground'>TRACERS · Energia</p>
          </div>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <BadgeAlert className='h-5 w-5 text-yellow-500' />
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>
              Qualidade de sinal degradada abaixo do limiar (61%)
            </p>
            <p className='text-sm text-muted-foreground'>SGDC · Comunicação</p>
          </div>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <MessageSquareWarning className='h-5 w-5 text-green-300' />
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm leading-none font-medium'>
              Sequência de manobra orbital iniciada
            </p>
            <p className='text-sm text-muted-foreground'>REAL · Info</p>
          </div>
        </div>
      </div>
    </div>
  )
}
