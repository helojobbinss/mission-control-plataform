import { cn } from '@/lib/utils'

/** Etiqueta de status no mesmo estilo da tabela de satélites do Painel Geral. */
export function StatusPill({
  label,
  color,
  pulse,
  className,
}: {
  label: string
  color: string
  pulse?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-medium whitespace-nowrap',
        className
      )}
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}12`,
      }}
    >
      {pulse && (
        <span className='relative flex size-1.5'>
          <span
            className='absolute inline-flex size-full animate-ping rounded-full opacity-75'
            style={{ backgroundColor: color }}
          />
          <span
            className='relative inline-flex size-1.5 rounded-full'
            style={{ backgroundColor: color }}
          />
        </span>
      )}
      {label}
    </span>
  )
}

/** Barra horizontal fina para sinal / bateria / qualidade. */
export function MeterBar({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const color =
    value === 0
      ? '#ff5263'
      : value < 30
        ? '#ff5263'
        : value < 70
          ? '#fbbf24'
          : '#10dba4'
  return (
    <div
      className={cn(
        'h-1.5 w-full overflow-hidden rounded-full bg-muted',
        className
      )}
    >
      <div
        className='h-full rounded-full transition-[width] duration-700'
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  )
}
