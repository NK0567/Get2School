import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface SerieGraphique {
  cle: string
  libelle: string
  couleur?: string
}

interface Props {
  donnees: Record<string, string | number | null>[]
  axeX: string
  series: SerieGraphique[]
  hauteur?: number
  /** Ligne horizontale de reference, typiquement la moyenne de passage. */
  reference?: { valeur: number; libelle: string }
  domaineY?: [number, number]
}

const PALETTE = ['#1D6FE0', '#D97706', '#16A34A', '#DC2626']

/**
 * Courbe d'evolution · PROPRIETAIRE : Boris
 * Couleurs de la charte, quatre series au maximum : au-dela c'est illisible.
 */
export function GraphiqueLignes({ donnees, axeX, series, hauteur = 300, reference, domaineY }: Props) {
  return (
    <ResponsiveContainer width="100%" height={hauteur}>
      <LineChart data={donnees} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey={axeX} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <YAxis domain={domaineY} tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
          labelStyle={{ color: '#0F2A43', fontWeight: 600 }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {reference && (
          <ReferenceLine
            y={reference.valeur}
            stroke="#94A3B8"
            strokeDasharray="4 4"
            label={{ value: reference.libelle, position: 'right', fontSize: 10, fill: '#64748B' }}
          />
        )}
        {series.slice(0, 4).map((s, i) => (
          <Line
            key={s.cle}
            type="monotone"
            dataKey={s.cle}
            name={s.libelle}
            stroke={s.couleur ?? PALETTE[i]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
