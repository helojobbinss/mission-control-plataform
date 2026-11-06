type MissionSummary = { id: number | string; name: string; status: string }

export type DashboardSatellite = {
  id: number
  name: string
  norad_id: number
  missions: MissionSummary[]
}

export type DashboardOrbit = { elements: { EPOCH?: string } }
export type DashboardReception = {
  signal: { state: string; label: string }
  observation: { start: string; station_name: string | null; waterfall_status: string | null } | null
}

type QueryState<T> = { data?: T; isLoading: boolean; isError: boolean }

function formatAge(timestamp: string | undefined) {
  if (!timestamp) return '—'
  const date = new Date(timestamp.endsWith('Z') ? timestamp : `${timestamp}Z`)
  if (!Number.isFinite(date.getTime())) return '—'
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000))
  if (minutes < 60) return minutes < 1 ? 'agora' : `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `há ${hours} h`
  return `há ${Math.floor(hours / 24)} dias`
}

function receptionTone(state: string | undefined) {
  if (state === 'detected' || state === 'validated') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  if (state === 'not_detected') return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  return 'border-muted text-muted-foreground'
}

export function Overview({
  satellites,
  orbit,
  reception,
  loading,
}: {
  satellites: DashboardSatellite[]
  orbit: QueryState<DashboardOrbit>[]
  reception: QueryState<DashboardReception>[]
  loading: boolean
}) {
  if (loading) return <p className='py-8 text-center text-sm text-muted-foreground'>Carregando dados da frota...</p>
  if (satellites.length === 0) return <div className='py-8 text-center'><p className='font-medium'>Nenhum satélite cadastrado.</p><p className='mt-1 text-xs text-muted-foreground'>Cadastre um satélite no monitoramento para exibi-lo aqui.</p></div>

  return (
    <div className='w-full overflow-x-auto'>
      <table className='w-full min-w-[620px] border-collapse text-sm'>
        <thead><tr className='border-b border-border text-muted-foreground'><th className='px-4 py-3 text-left font-normal'>Satélite</th><th className='px-3 py-3 text-center font-normal'>Missões ativas</th><th className='px-3 py-3 text-left font-normal'>Última recepção pública</th><th className='px-3 py-3 text-right font-normal'>Época orbital</th></tr></thead>
        <tbody>{satellites.map((satellite, index) => {
          const orbitQuery = orbit[index]
          const receptionQuery = reception[index]
          const receptionData = receptionQuery?.data
          const missionCount = (satellite.missions ?? []).filter((mission) => mission.status === 'Ativa').length
          const receptionLabel = receptionQuery?.isLoading ? 'Consultando' : receptionQuery?.isError ? 'Fonte indisponível' : receptionData?.signal?.label ?? 'Sem observações públicas'
          const receptionAge = receptionData?.observation ? formatAge(receptionData.observation.start) : null
          const epochAge = orbitQuery?.data ? formatAge(orbitQuery.data.elements?.EPOCH) : orbitQuery?.isLoading ? 'Consultando' : 'Indisponível'
          return <tr key={satellite.id} className='border-b border-border/60 last:border-0 hover:bg-muted/30'>
            <td className='px-4 py-3'><p className='font-semibold text-foreground'>{satellite.name}</p><p className='font-mono text-xs text-muted-foreground'>NORAD {satellite.norad_id}</p></td>
            <td className='px-3 py-3 text-center font-mono'>{missionCount}</td>
            <td className='px-3 py-3'><span className={`inline-flex max-w-[220px] flex-col rounded-md border px-2 py-1 text-xs ${receptionTone(receptionData?.signal?.state)}`}><span className='truncate'>{receptionLabel}</span>{receptionData?.observation && <span className='mt-0.5 truncate opacity-75'>{receptionData.observation.station_name ?? 'Estação pública'} · {receptionAge}</span>}</span></td>
            <td className='px-3 py-3 text-right font-mono text-xs text-muted-foreground'>{epochAge}</td>
          </tr>
        })}</tbody>
      </table>
      <p className='px-4 pt-3 text-[11px] text-muted-foreground'>A recepção SatNOGS é esporádica e depende de estações públicas. Ela não confirma, por si só, a saúde do satélite.</p>
    </div>
  )
}
