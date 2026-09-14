import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { cn } from './cn'

export interface Colonne<T> {
  cle: string
  entete: string
  rendu: (ligne: T) => ReactNode
  className?: string
  /** Rend l'en-tête cliquable. Le tri lui-même est géré par l'appelant. */
  triable?: boolean
}

export interface EtatTri {
  cle: string
  sens: 'asc' | 'desc'
}

interface Props<T> {
  colonnes: Colonne<T>[]
  lignes: T[]
  cleLigne: (ligne: T) => string
  onLigneCliquee?: (ligne: T) => void
  tri?: EtatTri
  onTri?: (cle: string) => void
}

export function Tableau<T>({ colonnes, lignes, cleLigne, onLigneCliquee, tri, onTri }: Props<T>) {
  return (
    <div className="border-line bg-surface overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-line bg-canvas border-b">
            {colonnes.map((c) => (
              <th
                key={c.cle}
                onClick={() => c.triable && onTri?.(c.cle)}
                className={cn(
                  'text-muted px-4 py-2.5 text-left text-[12px] font-semibold',
                  c.triable && 'hover:text-ink cursor-pointer transition select-none',
                  c.className,
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {c.entete}
                  {c.triable &&
                    (tri?.cle === c.cle ? (
                      tri.sens === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="h-3 w-3 opacity-40" />
                    ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => (
            <tr
              key={cleLigne(ligne)}
              onClick={() => onLigneCliquee?.(ligne)}
              className={cn(
                'border-line h-12 border-b transition last:border-0',
                onLigneCliquee && 'hover:bg-primary-50 cursor-pointer',
              )}
            >
              {colonnes.map((c) => (
                <td key={c.cle} className={cn('text-ink px-4', c.className)}>
                  {c.rendu(ligne)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
