import type { InputHTMLAttributes } from 'react'
import { cn } from './cn'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  libelle?: string
}

export function CaseACocher({ libelle, className, id, ...reste }: Props) {
  const identifiant = id ?? reste.name
  return (
    <label htmlFor={identifiant} className="text-ink inline-flex cursor-pointer items-center gap-2 text-sm">
      <input
        id={identifiant}
        type="checkbox"
        className={cn('border-line text-primary focus:ring-primary-50 h-4 w-4 rounded', className)}
        {...reste}
      />
      {libelle}
    </label>
  )
}
