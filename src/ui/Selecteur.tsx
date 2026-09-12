import type { SelectHTMLAttributes } from 'react'
import { cn } from './cn'

export interface OptionSelecteur {
  valeur: string
  libelle: string
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  libelle?: string
  erreur?: string
  requis?: boolean
  options: OptionSelecteur[]
  placeholder?: string
}

export function Selecteur({ libelle, erreur, requis, options, placeholder, className, id, ...reste }: Props) {
  const identifiant = id ?? reste.name
  return (
    <div className="flex flex-col gap-1">
      {libelle && (
        <label htmlFor={identifiant} className="text-ink text-[13px] font-medium">
          {libelle} {requis && <span className="text-danger">*</span>}
        </label>
      )}
      <select
        id={identifiant}
        className={cn(
          'bg-surface text-ink h-10 rounded-lg border px-3 text-sm transition outline-none',
          'focus:border-primary focus:ring-primary-50 focus:ring-2',
          erreur ? 'border-danger' : 'border-line',
          className,
        )}
        {...reste}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
      {erreur && <span className="text-danger text-xs">{erreur}</span>}
    </div>
  )
}
