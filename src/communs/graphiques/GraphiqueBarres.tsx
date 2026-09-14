import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SerieGraphique } from './GraphiqueLignes'

interface Props {
  donnees: Record<string, string | number | null>[]
  axeX: string
  series: SerieGraphique[]
  hauteur?: number
  reference?: { valeur: number; libelle: string }
  horizontal?: boolean
}

const PALETTE = ['#1D6FE0', '#D97706', '#16A34A', '#DC2626']

/** Comparaison entre catégories · PROPRIETAIRE : Boris */
export function GraphiqueBarres({ donnees, axeX, series, hauteur = 300, reference, horizontal }: Props) {
  return (
    <ResponsiveContainer width="100%" height={hauteur}>
      <BarChart
        data={donnees}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 8, right: 12, left: horizontal ? 40 : -16, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#E2E8F0"
          vertical={horizontal}
          horizontal={!horizontal}
        />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey={axeX}
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={axeX}
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
          </>
        )}
        <Tooltip
          cursor={{ fill: '#EAF2FE' }}
          contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
          labelStyle={{ color: '#0F2A43', fontWeight: 600 }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {reference && <ReferenceLine y={reference.valeur} stroke="#94A3B8" strokeDasharray="4 4" />}
        {series.slice(0, 4).map((s, i) => (
          <Bar
            key={s.cle}
            dataKey={s.cle}
            name={s.libelle}
            fill={s.couleur ?? PALETTE[i]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
