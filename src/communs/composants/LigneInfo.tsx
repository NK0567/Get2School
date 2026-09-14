import type { ReactNode } from 'react'

/** Couple libelle / valeur des fiches de détail. */
export function LigneInfo({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-muted text-[11px] font-medium tracking-wide uppercase">{libelle}</span>
      <span className="text-ink text-sm">{children ?? '—'}</span>
    </div>
  )
}

/** Groupe de LigneInfo, sur deux ou trois colonnes. */
export function GrilleInfos({ colonnes = 3, children }: { colonnes?: 2 | 3 | 4; children: ReactNode }) {
  const classes = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[colonnes]
  return <div className={`grid gap-x-6 ${classes} max-md:grid-cols-2`}>{children}</div>
}
