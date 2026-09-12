import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from './cn'

interface Props {
  libelle: string
  valeur: string | number
  variation?: number
  icone?: ReactNode
  detail?: string
}

export function CarteStat({ libelle, valeur, variation, icone, detail }: Props) {
  return (
    <div className="border-line bg-surface rounded-xl border p-5">
      <div className="mb-1 flex items-start justify-between">
        <span className="text-muted text-[13px] font-medium">{libelle}</span>
        {icone && <span className="text-primary">{icone}</span>}
      </div>
      <div className="text-ink text-3xl font-bold tabular-nums">{valeur}</div>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {variation !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-medium',
              variation >= 0 ? 'text-success' : 'text-danger',
            )}
          >
            {variation >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(variation)} %
          </span>
        )}
        {detail && <span className="text-muted">{detail}</span>}
      </div>
    </div>
  )
}
