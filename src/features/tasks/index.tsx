import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown' 
import { ThemeSwitch } from '@/components/theme-switch'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'
import { useQuery } from '@tanstack/react-query'
import { listMissions } from './data/api'

export function Tasks() {
  const { data: tasks = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['missions'], queryFn: listMissions,
  })
  return (
    <TasksProvider>
      <Header>
        <div className='ml-auto flex items-center gap-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Controle de Missões
            </h2>
            <p className='text-muted-foreground'>
              Agende, gerencie e acompanhe todas as missões de satélites
            </p>
          </div>
          <TasksPrimaryButtons />
        </div>
        {isLoading ? <p>Carregando missões...</p> : isError ? (
          <p>Não foi possível carregar as missões. <button type='button' onClick={() => refetch()}>Tentar novamente</button></p>
        ) : <TasksTable data={tasks} />}
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}
