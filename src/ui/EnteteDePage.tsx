import type { ReactNode } from 'react'

interface Props {
  titre: string
  sousTitre?: string
  filAriane?: string[]
  actions?: ReactNode
}

export function EnteteDePage({ titre, sousTitre, filAriane, actions }: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        {filAriane && filAriane.length > 0 && (
          <div className="text-muted mb-1 text-xs">{filAriane.join(' / ')}</div>
        )}
        <h1 className="text-ink text-2xl font-semibold">{titre}</h1>
        {sousTitre && <p className="text-muted mt-0.5 text-sm">{sousTitre}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
