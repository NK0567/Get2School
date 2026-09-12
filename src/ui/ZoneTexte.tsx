import type { TextareaHTMLAttributes } from 'react'
import { cn } from './cn'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  libelle?: string
  aide?: string
  erreur?: string
  requis?: boolean
}

export function ZoneTexte({ libelle, aide, erreur, requis, className, id, ...reste }: Props) {
  const identifiant = id ?? reste.name
  return (
    <div className="flex flex-col gap-1">
      {libelle && (
        <label htmlFor={identifiant} className="text-ink text-[13px] font-medium">
          {libelle} {requis && <span className="text-danger">*</span>}
        </label>
      )}
      <textarea
        id={identifiant}
        rows={reste.rows ?? 4}
        className={cn(
          'bg-surface text-ink rounded-lg border px-3 py-2 text-sm transition outline-none',
          'placeholder:text-muted focus:border-primary focus:ring-primary-50 focus:ring-2',
          erreur ? 'border-danger' : 'border-line',
          className,
        )}
        {...reste}
      />
      {erreur ? (
        <span className="text-danger text-xs">{erreur}</span>
      ) : (
        aide && <span className="text-muted text-xs">{aide}</span>
      )}
    </div>
  )
}
