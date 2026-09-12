import { Switch } from '@headlessui/react'
import { cn } from './cn'

interface Props {
  actif: boolean
  onChange: (actif: boolean) => void
  libelle?: string
  description?: string
  desactive?: boolean
}

export function Interrupteur({ actif, onChange, libelle, description, desactive }: Props) {
  return (
    <div className="flex items-start gap-3">
      <Switch
        checked={actif}
        onChange={onChange}
        disabled={desactive}
        className={cn(
          'mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition',
          actif ? 'bg-primary' : 'bg-line',
          desactive && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-3.5 rounded-full bg-white transition',
            actif ? 'translate-x-[18px]' : 'translate-x-[3px]',
          )}
        />
      </Switch>
      {(libelle || description) && (
        <div className="flex flex-col">
          {libelle && <span className="text-ink text-sm font-medium">{libelle}</span>}
          {description && <span className="text-muted text-xs">{description}</span>}
        </div>
      )}
    </div>
  )
}
