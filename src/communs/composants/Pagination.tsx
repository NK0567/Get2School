import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Bouton } from '../../ui'

interface Props {
  page: number
  taille: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ page, taille, total, onChange }: Props) {
  const nbPages = Math.ceil(total / taille)
  if (nbPages <= 1) return null

  const debut = page * taille + 1
  const fin = Math.min((page + 1) * taille, total)

  return (
    <div className="text-muted mt-3 flex items-center justify-between text-[13px]">
      <span className="tabular-nums">
        {debut} a {fin} sur {total}
      </span>
      <div className="flex items-center gap-2">
        <Bouton
          variante="secondaire"
          taille="sm"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          icone={<ChevronLeft className="h-4 w-4" />}
        >
          Precedent
        </Bouton>
        <span className="tabular-nums">
          Page {page + 1} sur {nbPages}
        </span>
        <Bouton
          variante="secondaire"
          taille="sm"
          disabled={page + 1 >= nbPages}
          onClick={() => onChange(page + 1)}
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Bouton>
      </div>
    </div>
  )
}
