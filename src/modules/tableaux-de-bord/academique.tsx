/**
 * Bloc de tableau de bord des roles pedagogiques · PROPRIETAIRE : Fabrice
 * Affiche pour ACADEMIC_HEAD et TEACHER.
 *
 * A construire : mes classes et mes matieres, evaluations a saisir, moyenne
 * generale, taux de reussite, eleves a risque.
 */
import { EtatVide } from '../../ui'
import { LineChart } from 'lucide-react'

export function TableauDeBordAcademique() {
  return (
    <div className="mt-5">
      <EtatVide
        titre="Tableau de bord pedagogique"
        description="Bloc a construire dans le lot C : evaluations a saisir, moyennes par classe, taux de reussite et eleves a risque."
        icone={<LineChart className="h-8 w-8" />}
      />
    </div>
  )
}
