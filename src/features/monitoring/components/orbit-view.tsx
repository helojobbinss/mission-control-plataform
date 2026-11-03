import { useEffect, useRef, useState } from 'react'
import {
  type Satellite,
  orbitalAngle,
  satellites,
  statusColor,
} from '../data/fleet'

const SIZE = 400
const C = SIZE / 2
const EARTH_R = 40

/** Raio do desenho em escala logarítmica (LEO e GEO cabem na mesma tela). */
function orbitRadius(alt: number) {
  // LEO ganha mais espaço visual (linear), MEO/GEO em escala log
  if (alt < 2000) return 60 + ((alt - 300) / 500) * 45
  const min = Math.log10(2000)
  const max = Math.log10(36000)
  return 125 + 55 * ((Math.log10(alt) - min) / (max - min))
}

function geometry(sat: Satellite) {
  const alt = sat.altitude ?? 450
  const rx = orbitRadius(alt)
  const ry =
    rx * Math.max(0.28, Math.abs(Math.cos((sat.inclination * Math.PI) / 180)))
  // rotação do plano só para dar variedade visual
  const rot = (sat.phase * 57) % 180
  return { rx, ry, rot }
}

function position(sat: Satellite, t: number) {
  const { rx, ry, rot } = geometry(sat)
  const a = orbitalAngle(sat, t)
  const x = rx * Math.cos(a)
  const y = ry * Math.sin(a)
  const r = (rot * Math.PI) / 180
  return {
    x: C + x * Math.cos(r) - y * Math.sin(r),
    y: C + x * Math.sin(r) + y * Math.cos(r),
    // metade de trás da órbita (atrás da Terra)
    behind:
      Math.sin(a) < 0 &&
      Math.hypot(
        x * Math.cos(r) - y * Math.sin(r),
        x * Math.sin(r) + y * Math.cos(r)
      ) <
        EARTH_R + 2,
  }
}

export function OrbitView({
  selectedId,
  onSelect,
}: {
  selectedId: string
  onSelect: (id: string) => void
}) {
  const [t, setT] = useState(0)
  const start = useRef<number | null>(null)

  useEffect(() => {
    let frame = 0
    const loop = (ts: number) => {
      if (start.current === null) start.current = ts
      setT((ts - start.current) / 1000)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className='relative'>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className='mx-auto aspect-square w-full max-w-[460px] overflow-visible'
        role='img'
        aria-label='Visualização das órbitas dos satélites'
      >
        <defs>
          <radialGradient id='earth' cx='38%' cy='35%' r='75%'>
            <stop offset='0%' stopColor='#38bdf8' />
            <stop offset='55%' stopColor='#1d4ed8' />
            <stop offset='100%' stopColor='#0b1a3a' />
          </radialGradient>
          <radialGradient id='atmo' r='50%'>
            <stop offset='80%' stopColor='#38bdf8' stopOpacity='0' />
            <stop offset='100%' stopColor='#38bdf8' stopOpacity='0.25' />
          </radialGradient>
        </defs>

        {/* grade de alcance */}
        {[70, 120, 170].map((r) => (
          <circle
            key={r}
            cx={C}
            cy={C}
            r={r}
            fill='none'
            className='stroke-border'
            strokeDasharray='2 6'
          />
        ))}
        <line
          x1={C}
          y1={10}
          x2={C}
          y2={SIZE - 10}
          className='stroke-border'
          strokeDasharray='2 6'
        />
        <line
          x1={10}
          y1={C}
          x2={SIZE - 10}
          y2={C}
          className='stroke-border'
          strokeDasharray='2 6'
        />

        {/* órbitas */}
        {satellites.map((sat) => {
          const { rx, ry, rot } = geometry(sat)
          const selected = sat.id === selectedId
          return (
            <ellipse
              key={sat.id}
              cx={C}
              cy={C}
              rx={rx}
              ry={ry}
              transform={`rotate(${rot} ${C} ${C})`}
              fill='none'
              stroke={statusColor[sat.status]}
              strokeOpacity={selected ? 0.9 : 0.22}
              strokeWidth={selected ? 1.6 : 1}
              strokeDasharray={sat.status === 'OFFLINE' ? '3 5' : undefined}
            />
          )
        })}

        {/* Terra */}
        <circle cx={C} cy={C} r={EARTH_R + 6} fill='url(#atmo)' />
        <circle cx={C} cy={C} r={EARTH_R} fill='url(#earth)' />
        <ellipse
          cx={C}
          cy={C}
          rx={EARTH_R}
          ry={EARTH_R * 0.35}
          fill='none'
          stroke='#fff'
          strokeOpacity='0.15'
        />
        <ellipse
          cx={C}
          cy={C}
          rx={EARTH_R * 0.35}
          ry={EARTH_R}
          fill='none'
          stroke='#fff'
          strokeOpacity='0.15'
        />

        {/* satélites */}
        {satellites.map((sat) => {
          const p = position(sat, sat.status === 'OFFLINE' ? 0 : t)
          const color = statusColor[sat.status]
          const selected = sat.id === selectedId
          return (
            <g
              key={sat.id}
              className='cursor-pointer'
              onClick={() => onSelect(sat.id)}
              opacity={p.behind ? 0.35 : 1}
            >
              {selected && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={11}
                  fill='none'
                  stroke={color}
                  strokeOpacity='0.6'
                >
                  <animate
                    attributeName='r'
                    values='7;14;7'
                    dur='2s'
                    repeatCount='indefinite'
                  />
                  <animate
                    attributeName='stroke-opacity'
                    values='0.8;0;0.8'
                    dur='2s'
                    repeatCount='indefinite'
                  />
                </circle>
              )}
              <circle cx={p.x} cy={p.y} r={selected ? 5 : 3.5} fill={color} />
              <circle cx={p.x} cy={p.y} r={12} fill='transparent' />
              <text
                x={p.x + (p.x >= C ? 9 : -9)}
                y={p.y + (p.y >= C ? 14 : -8)}
                textAnchor={p.x >= C ? 'start' : 'end'}
                className='fill-foreground font-mono'
                fontSize={selected ? 11 : 9}
                fontWeight={selected ? 700 : 400}
                opacity={selected ? 1 : 0.7}
              >
                {sat.name}
              </text>
            </g>
          )
        })}
      </svg>
      <div className='pointer-events-none absolute start-0 bottom-0 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase'>
        Escala log · simulação ×60
      </div>
    </div>
  )
}
