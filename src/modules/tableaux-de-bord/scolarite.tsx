/**
 * Bloc de tableau de bord des rôles de scolarité et de finance · PROPRIETAIRE : Alida
 * Affiche pour SECRETARY et ACCOUNTANT.
 *
 * A construire : inscriptions du jour, dossiers incomplets, encaissements de
 * la semaine, taux de recouvrement, listes financieres a produire.
 */
import { EtatVide } from '../../ui'
import { Wallet } from 'lucide-react'

export function TableauDeBordScolarite() {
  return (
    <div className="mt-5">
      <EtatVide
        titre="Tableau de bord scolarité et finance"
        description="Bloc à construire dans le lot B : inscriptions recentes, dossiers incomplets, encaissements et taux de recouvrement."
        icone={<Wallet className="h-8 w-8" />}
      />
    </div>
  )
}
