import { cn } from './cn'

export function Squelette({ className }: { className?: string }) {
  return <div className={cn('bg-line animate-pulse rounded', className)} />
}

/** Squelette de tableau, a afficher pendant le chargement d'une liste. */
export function SqueletteTableau({ lignes = 6, colonnes = 5 }: { lignes?: number; colonnes?: number }) {
  return (
    <div className="border-line bg-surface overflow-hidden rounded-xl border">
      {Array.from({ length: lignes }).map((_, l) => (
        <div key={l} className="border-line flex items-center gap-4 border-b px-4 py-3 last:border-0">
          {Array.from({ length: colonnes }).map((__, c) => (
            <Squelette key={c} className={cn('h-4', c === 0 ? 'w-40' : 'w-24')} />
          ))}
        </div>
      ))}
    </div>
  )
}
