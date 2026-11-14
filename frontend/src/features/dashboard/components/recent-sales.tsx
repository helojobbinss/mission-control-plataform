import { AlertTriangle, BadgeCheck, Info, LoaderCircle } from 'lucide-react'

export type DashboardAlert = {
  id: string
  severity: 'critical' | 'warning' | 'info'
  category: string
  title: string
  detail: string
}

const styles = {
  critical: { icon: AlertTriangle, classes: 'text-rose-500', label: 'Crítico' },
  warning: { icon: AlertTriangle, classes: 'text-amber-500', label: 'Atenção' },
  info: { icon: Info, classes: 'text-sky-500', label: 'Dados' },
}

export function RecentSales({ alerts, loading }: { alerts: DashboardAlert[]; loading: boolean }) {
  if (loading && alerts.length === 0) return <div className='flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground'><LoaderCircle className='size-4 animate-spin' /> Consultando fontes e prazos...</div>
  if (alerts.length === 0) return <div className='flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] p-4'><BadgeCheck className='mt-0.5 size-5 shrink-0 text-emerald-500' /><div><p className='text-sm font-medium'>Nenhum aviso encontrado.</p><p className='mt-1 text-xs text-muted-foreground'>Isso significa que não há prazos vencidos ou problemas nas fontes consultadas; não confirma a saúde dos satélites.</p></div></div>

  return <div className='space-y-4'>{alerts.slice(0, 6).map((alert) => {
    const style = styles[alert.severity]
    const Icon = style.icon
    return <div key={alert.id} className='flex items-start gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0'>
      <Icon className={`mt-0.5 size-4 shrink-0 ${style.classes}`} />
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'><p className='text-sm leading-snug font-medium'>{alert.title}</p><span className={`rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${style.classes}`}>{alert.category}</span></div>
        <p className='mt-1 text-xs text-muted-foreground'>{alert.detail}</p>
      </div>
    </div>
  })}</div>
}
