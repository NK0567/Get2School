import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface Props {
  titre: string
  description?: string
  icone?: ReactNode
  action?: ReactNode
}

export function EtatVide({ titre, description, icone, action }: Props) {
  return (
    <div className="border-line bg-surface flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-14 text-center">
      <div className="text-muted">{icone ?? <Inbox className="h-8 w-8" />}</div>
      <div>
        <p className="text-ink text-sm font-semibold">{titre}</p>
        {description && <p className="text-muted mt-1 max-w-sm text-[13px]">{description}</p>}
      </div>
      {action}
    </div>
  )
}
