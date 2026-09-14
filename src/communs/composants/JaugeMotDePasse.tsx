import { Check, X } from 'lucide-react'
import { cn } from '../../ui'
import { EXIGENCES, LIBELLE_FORCE, evaluerMotDePasse } from '../motDePasse'
import type { ContexteMotDePasse } from '../motDePasse'

interface Props {
  valeur: string
  contexte?: ContexteMotDePasse
}

const COULEURS = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success']

/**
 * Affiche la politique en clair plutôt qu'un simple message d'erreur après
 * coup. L'utilisateur voit ce qu'il lui reste à faire pendant qu'il saisit.
 */
export function JaugeMotDePasse({ valeur, contexte }: Props) {
  const evaluation = evaluerMotDePasse(valeur, contexte)
  if (!valeur) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-1">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                'flex-1 rounded-full transition',
                index <= evaluation.force ? COULEURS[evaluation.force] : 'bg-line',
              )}
            />
          ))}
        </div>
        <span className="text-muted w-20 text-right text-xs font-medium">
          {LIBELLE_FORCE[evaluation.force]}
        </span>
      </div>

      <ul className="flex flex-col gap-0.5">
        {EXIGENCES.map((exigence) => {
          const ok = evaluation.satisfaites.includes(exigence.cle)
          return (
            <li
              key={exigence.cle}
              className={cn('flex items-center gap-1.5 text-xs', ok ? 'text-success' : 'text-muted')}
            >
              {ok ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
              {exigence.libelle}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
