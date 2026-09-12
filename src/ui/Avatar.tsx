import { cn } from './cn'
import { initiales } from '../communs/formats'

interface Props {
  prenom?: string
  nom?: string
  url?: string
  taille?: 'sm' | 'md' | 'lg'
}

const TAILLES = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-14 w-14 text-base',
}

export function Avatar({ prenom, nom, url, taille = 'md' }: Props) {
  if (url) {
    return (
      <img
        src={url}
        alt={`${prenom ?? ''} ${nom ?? ''}`}
        className={cn('rounded-full object-cover', TAILLES[taille])}
      />
    )
  }
  return (
    <div
      className={cn(
        'bg-primary-50 text-primary flex shrink-0 items-center justify-center rounded-full font-semibold',
        TAILLES[taille],
      )}
    >
      {initiales(prenom, nom)}
    </div>
  )
}
