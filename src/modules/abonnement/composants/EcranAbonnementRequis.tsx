/**
 * Écran d'abonnement requis · lot A (Boris)
 *
 * Affiché à la place de toute l'application dès que l'essai gratuit est
 * expiré et qu'aucun abonnement n'est actif — même principe que le
 * changement de mot de passe obligatoire : un blocage, pas un rappel.
 *
 * Aucune intégration de paiement : les modes de paiement sont un chantier
 * à part, explicitement mis de côté. Ce bouton enregistre le choix et
 * active l'établissement, sans simuler une transaction qui n'existe pas.
 */
import { CalendarClock, Check } from 'lucide-react'
import { Alerte, Bouton, useToast } from '../../../ui'
import { useSession } from '../../../socle/etat/useSession'
import { TARIFS } from '../calculs'
import type { RaisonFinEssai } from '../../../socle/modeles/administration'
import { useSabonner, useStatutEssai } from '../hooks/useAbonnement'

const LIBELLE_RAISON: Record<RaisonFinEssai, string> = {
  PERIODE_VERROUILLEE: 'Vous avez verrouillé le premier trimestre.',
  BULLETINS_COMPLETS: 'Les bulletins de tous les élèves ont été générés pour la première période.',
  QUATRE_MOIS_ECOULES: "Quatre mois se sont écoulés depuis la création de l'établissement.",
}

export function EcranAbonnementRequis() {
  const toast = useToast()
  const utilisateur = useSession((e) => e.utilisateur)
  const requete = useStatutEssai()
  const sabonner = useSabonner()

  const raison = requete.data?.abonnement.essaiRaison
  // Avant tout abonnement, planId n'existe pas encore : c'est la catégorie
  // réelle de l'établissement, renvoyée par le serveur, qui détermine le
  // tarif affiché — jamais une valeur par défaut arbitraire.
  const plan = requete.data?.categorie ?? 'SECONDARY'
  const tarif = TARIFS[plan]
  const peutSabonner = utilisateur?.role === 'SCHOOL_ADMIN'

  const valider = async () => {
    try {
      await sabonner.mutateAsync()
      toast('succes', "L'abonnement est actif. Bienvenue de nouveau.")
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? "L'abonnement a échoué.")
    }
  }

  return (
    <div className="bg-canvas flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="border-line bg-surface rounded-xl border p-7 text-center">
          <CalendarClock className="text-muted mx-auto mb-3 h-8 w-8" />
          <h1 className="text-ink mb-1 text-base font-semibold">Votre essai gratuit est terminé</h1>
          <p className="text-muted mb-5 text-sm">
            {raison ? LIBELLE_RAISON[raison] : "L'essai d'un trimestre est arrivé à échéance."}
          </p>

          <div className="border-line bg-canvas mb-5 rounded-lg border p-4 text-left">
            <div className="text-ink text-2xl font-semibold">
              {tarif.montant.toLocaleString('fr-FR')}{' '}
              <span className="text-muted text-sm">{tarif.devise}</span>
            </div>
            <div className="text-muted text-xs">{tarif.periode}</div>
            <ul className="text-muted mt-3 flex flex-col gap-1 text-[13px]">
              <li className="flex items-center gap-1.5">
                <Check className="text-success h-3.5 w-3.5" /> Valable jusqu'à la fin de l'année scolaire en
                cours
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="text-success h-3.5 w-3.5" /> Toutes les fonctionnalités, sans limite
              </li>
            </ul>
          </div>

          <Alerte ton="info">
            Les moyens de paiement en ligne arrivent bientôt. Cette action active votre compte immédiatement
            le temps de les mettre en place.
          </Alerte>

          <Bouton
            className="mt-4 w-full"
            chargement={sabonner.isPending}
            disabled={!peutSabonner}
            onClick={valider}
          >
            S'abonner maintenant
          </Bouton>

          {!peutSabonner && (
            <p className="text-muted mt-3 text-xs">
              Seul le Directeur ou Proviseur peut activer l'abonnement de l'établissement.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
