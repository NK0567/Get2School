import { Check } from 'lucide-react'
import { cn } from '../../../ui'

interface Props {
  etapes: string[]
  courante: number
}

export function IndicateurEtapes({ etapes, courante }: Props) {
  return (
    <div className="mb-7 flex items-center">
      {etapes.map((libelle, index) => {
        const faite = index < courante
        const active = index === courante
        return (
          <div key={libelle} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition',
                  faite && 'bg-success text-white',
                  active && 'bg-primary text-white',
                  !faite && !active && 'bg-line text-muted',
                )}
              >
                {faite ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn('text-[13px] max-md:hidden', active ? 'text-ink font-semibold' : 'text-muted')}
              >
                {libelle}
              </span>
            </div>
            {index < etapes.length - 1 && (
              <div className={cn('mx-3 h-px flex-1', faite ? 'bg-success' : 'bg-line')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
