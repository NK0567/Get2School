import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from './cn'

type Variante = 'primaire' | 'secondaire' | 'fantome' | 'danger'
type Taille = 'sm' | 'md'

const VARIANTES: Record<Variante, string> = {
  primaire: 'bg-primary text-white hover:bg-primary-600',
  secondaire: 'bg-surface text-ink border border-line hover:bg-canvas',
  fantome: 'bg-transparent text-muted hover:bg-canvas hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-95',
}

const TAILLES: Record<Taille, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  taille?: Taille
  chargement?: boolean
  icone?: ReactNode
}

export function Bouton({
  variante = 'primaire',
  taille = 'md',
  chargement = false,
  icone,
  className,
  children,
  disabled,
  ...reste
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante],
        TAILLES[taille],
        className,
      )}
      disabled={disabled || chargement}
      {...reste}
    >
      {chargement ? <Loader2 className="h-4 w-4 animate-spin" /> : icone}
      {children}
    </button>
  )
}
