import { Search } from 'lucide-react'
import { useNavigate } from 'react-router'

/**
 * Raccourci de la barre haute. Il ne cherche pas lui-même : il ouvre l'écran
 * de recherche, qui porte le terme dans son URL et reste donc partageable.
 */
export function RaccourciRecherche() {
  const naviguer = useNavigate()

  return (
    <button
      onClick={() => naviguer('/recherche')}
      className="border-line bg-canvas text-muted hover:border-primary/40 hover:text-ink flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px] transition max-md:hidden"
      title="Rechercher un élève, un enseignant, une classe ou un document"
    >
      <Search className="h-3.5 w-3.5" />
      Rechercher
    </button>
  )
}
