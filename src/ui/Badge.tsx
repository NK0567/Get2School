import type { ReactNode } from 'react'
import { cn } from './cn'

export type TonBadge = 'succes' | 'alerte' | 'danger' | 'info' | 'neutre'

const TONS: Record<TonBadge, string> = {
  succes: 'bg-success/10 text-success',
  alerte: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  neutre: 'bg-muted/10 text-muted',
}

export function Badge({ ton = 'neutre', children }: { ton?: TonBadge; children: ReactNode }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', TONS[ton])}
    >
      {children}
    </span>
  )
}
