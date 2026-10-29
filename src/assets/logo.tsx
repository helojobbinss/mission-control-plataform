import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src='/images/Logoofc-semfundo.png'
      alt='Mission Control Platform'
      className={cn('size-8 object-contain', className)}
    />
  )
}