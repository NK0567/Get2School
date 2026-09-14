import { Search, X } from 'lucide-react'

interface Props {
  valeur: string
  onChange: (valeur: string) => void
  placeholder?: string
  className?: string
}

/** Champ de recherche des barres de filtres. Toujours le premier element à gauche. */
export function ChampRecherche({ valeur, onChange, placeholder = 'Rechercher...', className }: Props) {
  return (
    <div className={`relative ${className ?? 'w-72'}`}>
      <Search className="text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <input
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-line bg-surface text-ink placeholder:text-muted focus:border-primary focus:ring-primary-50 h-10 w-full rounded-lg border pr-8 pl-9 text-sm transition outline-none focus:ring-2"
      />
      {valeur && (
        <button
          onClick={() => onChange('')}
          className="text-muted hover:text-ink absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 transition"
          aria-label="Effacer la recherche"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
