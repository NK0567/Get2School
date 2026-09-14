/**
 * Bloc de tableau de bord des rôles pedagogiques · PROPRIETAIRE : Fabrice
 * Affiche pour ACADEMIC_HEAD et TEACHER.
 *
 * A construire : mes classes et mes matières, évaluations a saisir, moyenne
 * generale, taux de réussite, élèves a risque.
 */
import { EtatVide } from '../../ui'
import { LineChart } from 'lucide-react'

export function TableauDeBordAcademique() {
  return (
    <div className="mt-5">
      <EtatVide
        titre="Tableau de bord pédagogique"
        description="Bloc à construire dans le lot C : évaluations à saisir, moyennes par classe, taux de réussite et élèves à risque."
        icone={<LineChart className="h-8 w-8" />}
      />
    </div>
  )
}
