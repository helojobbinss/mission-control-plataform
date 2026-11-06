import { useQueries, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BadgeAlert, Rocket, Satellite, TriangleAlert, Wallet } from 'lucide-react'
import { useMissionClock, formatLive } from '@/hooks/use-mission-clock'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { listMissions } from '@/features/tasks/data/api'
import { Overview, type DashboardSatellite, type DashboardOrbit, type DashboardReception } from './components/overview'
import { RecentSales, type DashboardAlert } from './components/recent-sales'

function dateOnly(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function ageOf(timestamp: string | undefined, now: Date) {
  if (!timestamp) return null
  const normalized = timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`
  const date = new Date(normalized)
  if (!Number.isFinite(date.getTime())) return null
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60_000))
  if (minutes < 60) return { minutes, label: minutes < 1 ? 'agora' : `há ${minutes} min` }
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return { minutes, label: `há ${hours} h` }
  const days = Math.floor(hours / 24)
  return { minutes, label: `há ${days} dias` }
}

export function Dashboard() {
  const { now } = useMissionClock(30_000)
  const today = dateOnly(now)
  const satellitesQuery = useQuery({
    queryKey: ['satellites'],
    queryFn: async () => (await axios.get<DashboardSatellite[]>('/api/satellites')).data,
    refetchInterval: 30_000,
  })
  const missionsQuery = useQuery({
    queryKey: ['missions'],
    queryFn: listMissions,
    select: (tasks) => tasks.map((task) => ({ ...task, name: task.title })),
    refetchInterval: 30_000,
  })
  const satellites = satellitesQuery.data ?? []
  const missions = missionsQuery.data ?? []
  const orbitQueries = useQueries({ queries: satellites.map((satellite) => ({
    queryKey: ['satellite-orbit', satellite.id],
    queryFn: async ({ signal }: { signal: AbortSignal }) => (await axios.get<DashboardOrbit>(`/api/satellites/${satellite.id}/orbit`, { signal })).data,
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
    retry: 1,
  })) })
  const receptionQueries = useQueries({ queries: satellites.map((satellite) => ({
    queryKey: ['satellite-reception', satellite.id],
    queryFn: async ({ signal }: { signal: AbortSignal }) => (await axios.get<DashboardReception>(`/api/satellites/${satellite.id}/reception`, { signal })).data,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: false,
  })) })

  const activeMissions = missions.filter((mission) => mission.status === 'Ativa')
  const plannedBudget = missions.reduce((sum, mission) => sum + (Number(mission.budget) || 0), 0)
  const alerts: DashboardAlert[] = []
  if (!satellitesQuery.isLoading && !missionsQuery.isLoading) {
    for (const mission of missions) {
      if (mission.status === 'Ativa' && mission.planned_end_date && mission.planned_end_date < today) {
        alerts.push({ id: `mission-overdue-${mission.id}`, severity: 'critical', category: 'Prazo', title: `Missão fora do prazo: ${mission.name}`, detail: `Ativa · prazo previsto ${mission.planned_end_date}` })
      } else if (mission.status === 'Ativa' && mission.planned_end_date === today) {
        alerts.push({ id: `mission-due-${mission.id}`, severity: 'warning', category: 'Prazo', title: `Prazo da missão vence hoje: ${mission.name}`, detail: `Missão ativa · ${mission.planned_end_date}` })
      }
      if (mission.status === 'Agendada' && mission.planned_start_date && mission.planned_start_date < today) {
        alerts.push({ id: `mission-start-${mission.id}`, severity: 'warning', category: 'Planejamento', title: `Início previsto já passou: ${mission.name}`, detail: `Ainda agendada · início previsto ${mission.planned_start_date}` })
      }
      if (['Agendada', 'Ativa'].includes(mission.status) && !mission.budget) {
        alerts.push({ id: `mission-budget-${mission.id}`, severity: 'info', category: 'Orçamento', title: `Orçamento não informado: ${mission.name}`, detail: `Missão ${mission.status.toLowerCase()} · sem valor planejado` })
      }
    }

    satellites.forEach((satellite, index) => {
      const receptionQuery = receptionQueries[index]
      const observation = receptionQuery?.data?.observation
      if (receptionQuery?.isError) {
        alerts.push({ id: `source-satnogs-${satellite.id}`, severity: 'info', category: 'Fonte de dados', title: 'SatNOGS indisponível', detail: `Não foi possível consultar observações públicas de ${satellite.name}.` })
      } else if (receptionQuery?.data?.signal?.state === 'no_data') {
        alerts.push({ id: `coverage-${satellite.id}`, severity: 'info', category: 'Cobertura', title: `Sem observações públicas: ${satellite.name}`, detail: 'Não há registro no SatNOGS; isso não confirma falha do satélite.' })
      } else if (observation?.waterfall_status === 'without-signal') {
        alerts.push({ id: `reception-${satellite.id}`, severity: 'info', category: 'Recepção pública', title: `Sinal não detectado na última observação: ${satellite.name}`, detail: `${observation.station_name ?? 'Estação pública'} · ${new Date(observation.start).toLocaleString('pt-BR')}` })
      }

      const epoch = orbitQueries[index]?.data?.elements?.EPOCH
      const epochAge = typeof epoch === 'string' ? ageOf(epoch, now) : null
      if (orbitQueries[index]?.isError) {
        alerts.push({ id: `orbit-source-${satellite.id}`, severity: 'warning', category: 'Dados orbitais', title: `Elementos orbitais indisponíveis: ${satellite.name}`, detail: 'Não foi possível atualizar a fonte CelesTrak.' })
      } else if (epochAge && epochAge.minutes > 7 * 24 * 60) {
        alerts.push({ id: `orbit-stale-${satellite.id}`, severity: 'warning', category: 'Dados orbitais', title: `Elementos orbitais antigos: ${satellite.name}`, detail: `Época dos elementos ${epochAge.label}. A posição calculada pode perder precisão.` })
      }
    })
  }

  const alertCount = alerts.filter((alert) => alert.severity === 'critical' || alert.severity === 'warning').length
  const isLoading = satellitesQuery.isLoading || missionsQuery.isLoading
  const hasError = satellitesQuery.isError || missionsQuery.isError

  return (
    <>
      <Header>
        <TopNav links={topNav} className='me-auto' />
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Painel de Controle da Missão</h1>
            <p className='mt-1 text-sm text-muted-foreground'>Resumo da frota, missões, orçamento e avisos derivados dos dados cadastrados.</p>
          </div>
        </div>
        <p className='mb-4 flex items-center gap-2 font-mono text-xs font-normal uppercase tracking-[0.2em] text-green-300'><span className='size-2 animate-pulse rounded-full bg-green-400' /> LOCAL · {formatLive(now)}</p>
        {hasError && <div role='alert' className='mb-4 rounded-lg border border-rose-500/40 bg-rose-500/[0.06] p-3 text-sm text-rose-700 dark:text-rose-300'>Não foi possível carregar todos os dados do painel. Tente atualizar a página.</div>}
        <div className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <Metric icon={Satellite} label='Satélites cadastrados' value={isLoading ? '—' : String(satellites.length)} hint='Frota registrada no banco local' tone='blue' />
            <Metric icon={Rocket} label='Missões ativas' value={isLoading ? '—' : String(activeMissions.length)} hint={`${missions.filter((mission) => mission.status === 'Agendada').length} agendada(s)`} tone='green' />
            <Metric icon={TriangleAlert} label='Alertas prioritários' value={isLoading ? '—' : String(alertCount)} hint='Prazos ou dados orbitais que exigem atenção' tone={alertCount ? 'red' : 'muted'} />
            <Metric icon={Wallet} label='Orçamento planejado' value={isLoading ? '—' : plannedBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} hint='Soma dos valores informados nas missões' tone='yellow' />
          </div>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
            <Card className='col-span-1 lg:col-span-4'>
              <CardHeader><CardTitle>Frota e situação das fontes</CardTitle></CardHeader>
              <CardContent className='ps-2'>
                <Overview satellites={satellites.map((satellite) => ({ ...satellite, missions: missions.filter((mission) => mission.satellite_id === satellite.id) }))} orbit={orbitQueries} reception={receptionQueries} loading={isLoading} />
              </CardContent>
            </Card>
            <Card className='col-span-1 lg:col-span-3'>
              <CardHeader className='flex flex-row items-start justify-between gap-3'><div><CardTitle>Alertas e avisos</CardTitle><p className='mt-1 text-xs text-muted-foreground'>Gerados a partir de prazos, dados orbitais e observações públicas.</p></div><BadgeAlert className='size-4 text-muted-foreground' /></CardHeader>
              <CardContent><RecentSales alerts={alerts} loading={isLoading || receptionQueries.some((query) => query.isLoading) || orbitQueries.some((query) => query.isLoading)} /></CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}

function Metric({ icon: Icon, label, value, hint, tone }: { icon: React.ElementType; label: string; value: string; hint: string; tone: 'blue' | 'green' | 'red' | 'yellow' | 'muted' }) {
  const colors = { blue: 'text-blue-500', green: 'text-green-500', red: 'text-red-500', yellow: 'text-yellow-500', muted: 'text-muted-foreground' }
  return <Card><CardHeader className='flex flex-row items-center justify-between space-y-0 pb-0'><CardTitle className='font-mono text-xs font-normal uppercase tracking-[0.16em]'>{label}</CardTitle><Icon className='size-4 text-muted-foreground' /></CardHeader><CardContent><div className={`text-2xl font-bold ${colors[tone]}`}>{value}</div><p className='mt-1 text-xs text-muted-foreground'>{hint}</p></CardContent></Card>
}

const topNav: any[] = []
