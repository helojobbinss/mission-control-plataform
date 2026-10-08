import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Analytics } from './components/analytics'
import { Overview } from './components/overview'
import { RecentSales } from './components/recent-sales'
import { Satellite, Rocket,TriangleAlert, RadioTower } from 'lucide-react'

export function Dashboard() {
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} className='me-auto' />
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Painel de Controle da Missão</h1>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
        <p className='font-mono text-xs font-normal uppercase tracking-[0.2em] text-green-300'>
        AO VIVO · Qui, 08 Oct 2026 22:53:13 
        </p>
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-0'>
                  <CardTitle className='font-mono text-xs font-normal uppercase tracking-[0.2em]'>
                    Satélites Ativos
                  </CardTitle>
                  <Satellite className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-blue-500'>4</div>
                  <p className='text-xs text-muted-foreground'>
                    2 com anomalia
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-0'>
                  <CardTitle className='font-mono text-xs font-normal uppercase tracking-[0.2em]'>
                    Missões ativas
                  </CardTitle>
                  <Rocket className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-green-500'>3</div>
                  <p className='text-xs text-muted-foreground'>
                    Custo total: R$ 82,4M
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-0'>
                  <CardTitle className='font-mono text-xs font-normal uppercase tracking-[0.2em]'>
                    Alertas Críticos 
                  </CardTitle>
                  <TriangleAlert className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-red-500'>2</div>
                  <p className='text-xs text-muted-foreground'>
                    Não reconhecidos
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-0'>
                  <CardTitle className='font-mono text-xs font-normal uppercase tracking-[0.2em]'>
                    Estações terrestres
                  </CardTitle>
                  <RadioTower className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-yellow-500'>3/4</div>
                  <p className='text-xs text-muted-foreground'>
                    1 em manutenção
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className='ps-2'>
                  <Overview />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Alertas Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentSales />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value='analytics' className='space-y-4'>
            <Analytics />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

const topNav: any[] = []
