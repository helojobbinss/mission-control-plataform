const satellites = [
  {
    name: 'SERPENS',
    id: 'SAT-001',
    status: 'OPERACIONAL',
    signal: 94,
    battery: 87,
    altitude: '412',
    color: '#10dba4',
    trend: [18, 12, 21, 32, 36, 29, 19, 12, 17, 28, 35, 37],
  },
  {
    name: 'SGDC',
    id: 'SAT-002',
    status: 'DEGRADADO',
    signal: 61,
    battery: 43,
    altitude: '523',
    color: '#fbbf24',
    trend: [15, 12, 20, 30, 37, 35, 27, 19, 15, 22, 31, 36],
  },
  {
    name: 'ITASat',
    id: 'SAT-003',
    status: 'OPERACIONAL',
    signal: 88,
    battery: 92,
    altitude: '705',
    color: '#10dba4',
    trend: [18, 12, 20, 30, 35, 29, 20, 13, 17, 28, 35, 37],
  },
  {
    name: 'TRACERS',
    id: 'SAT-004',
    status: 'CRÍTICO',
    signal: 22,
    battery: 18,
    altitude: '20.200',
    color: '#ff5263',
    trend: [16, 12, 20, 29, 37, 34, 25, 18, 13, 21, 31, 36],
  },
  {
    name: 'TES-22',
    id: 'SAT-005',
    status: 'OFFLINE',
    signal: 0,
    battery: 0,
    altitude: '—',
    color: '#64748b',
    trend: [],
  },
  {
    name: 'REAL',
    id: 'SAT-006',
    status: 'OPERACIONAL',
    signal: 97,
    battery: 95,
    altitude: '35.786',
    color: '#10dba4',
    trend: [18, 12, 20, 30, 35, 29, 20, 13, 17, 28, 35, 37],
  },
]

function SatelliteTrend({
  values,
  color,
}: {
  values: number[]
  color: string
}) {
  if (values.length === 0) {
    return (
      <div className='h-8 w-20 flex items-center'>
        <div className='w-full border-t-2 border-red-500' />
      </div>
    )
  }

  const points = values
    .map((value, index) => `${(index / (values.length - 1)) * 76},${value}`)
    .join(' ')

  return (
    <svg viewBox='0 0 76 40' className='h-8 w-20' aria-hidden='true'>
      <polyline
        points={points}
        fill='none'
        stroke={color}
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export function Overview() {
  return (
    <div className='w-full overflow-x-auto'>
      <table className='w-full min-w-[650px] border-collapse text-sm'>
        <thead>
          <tr className='border-b border-border text-muted-foreground'>
            <th className='px-4 py-3 text-left font-normal'>Satélite</th>
            <th className='px-3 py-3 text-left font-normal'>Status</th>
            <th className='px-3 py-3 text-center font-normal'>Sinal</th>
            <th className='px-3 py-3 text-center font-normal'>Bateria</th>
            <th className='px-3 py-3 text-center font-normal'>Alt (km)</th>
          </tr>
        </thead>

        <tbody>
          {satellites.map((satellite) => (
            <tr
              key={satellite.id}
              className='border-b border-border/60 last:border-0 hover:bg-muted/30'
            >
              <td className='px-4 py-3'>
                <div className='font-semibold text-foreground'>
                  {satellite.name}
                </div>
                <div className='font-mono text-xs text-muted-foreground'>
                  {satellite.id}
                </div>
              </td>

              <td className='px-3 py-3'>
                <span
                  className='inline-flex whitespace-nowrap rounded border px-2 py-1 font-mono text-[10px] font-medium'
                  style={{
                    color: satellite.color,
                    borderColor: `${satellite.color}55`,
                    backgroundColor: `${satellite.color}12`,
                  }}
                >
                  {satellite.status}
                </span>
              </td>

              <td
                className='px-3 py-3 text-center font-mono font-medium'
                style={{
                  color:
                    satellite.signal === 0
                      ? '#ff5263'
                      : satellite.signal < 70
                        ? '#fbbf24'
                        : satellite.color,
                }}
              >
                {satellite.signal}%
              </td>

              <td
                className='px-3 py-3 text-center font-mono font-medium'
                style={{
                  color:
                    satellite.battery === 0
                      ? '#ff5263'
                      : satellite.battery < 50
                        ? '#fbbf24'
                        : satellite.color,
                }}
              >
                {satellite.battery}%
              </td>

              <td className='px-3 py-3 text-center font-mono text-cyan-400'>
                {satellite.altitude}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


