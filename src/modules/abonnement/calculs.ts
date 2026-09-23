/**
 * Essai gratuit et abonnement · lot A (Boris)
 *
 * Fonction pure, même principe que les autres moteurs de calcul du projet.
 * L'essai se termine au premier des trois déclencheurs qui se produit :
 *
 *   1. Le responsable verrouille lui-même le premier trimestre.
 *   2. Les bulletins de tous les élèves de l'établissement ont été générés
 *      pour la première période.
 *   3. Quatre mois se sont écoulés depuis la création de l'établissement —
 *      au cinquième mois, l'abonnement devient obligatoire.
 *
 * Les deux premiers sont des événements explicites, enregistrés une fois
 * survenus (essaiTermine + essaiRaison). Le troisième est un calcul basé
 * sur la date du jour : il n'a besoin d'aucun état à part la date de départ
 * de l'essai, mais une fois détecté, le serveur l'enregistre aussi pour que
 * la raison affichée reste stable une fois franchie.
 */
import { addMonths, differenceInCalendarDays, endOfDay } from 'date-fns'
import type { Abonnement, RaisonFinEssai } from '../../socle/modeles/administration'

export type { RaisonFinEssai }

export interface StatutEssai {
  actif: boolean
  expire: boolean
  raison?: RaisonFinEssai
  joursRestants: number
}

const DUREE_ESSAI_MOIS = 4

export function evaluerEssai(abonnement: Abonnement, maintenant: Date): StatutEssai {
  if (abonnement.statut === 'ACTIF') {
    // Un abonnement actif reste actif jusqu'à sa date d'échéance — celle de
    // la fin de l'année scolaire pour laquelle il a été pris (RG explicite :
    // « l'abonnement se termine quand l'année scolaire se termine »). Sans
    // cette vérification, expireLe serait enregistré mais jamais consulté,
    // et un abonnement ne s'arrêterait jamais vraiment.
    // La journée d'échéance compte entièrement : « l'année se termine le
    // 15 juillet » inclut le 15 juillet, pas seulement jusqu'à minuit.
    if (abonnement.expireLe && maintenant > endOfDay(new Date(abonnement.expireLe))) {
      return { actif: false, expire: true, joursRestants: 0 }
    }
    return { actif: false, expire: false, joursRestants: 0 }
  }

  if (abonnement.essaiTermine) {
    return { actif: true, expire: true, raison: abonnement.essaiRaison, joursRestants: 0 }
  }

  const echeance = addMonths(new Date(abonnement.essaiDebute), DUREE_ESSAI_MOIS)
  const joursRestants = differenceInCalendarDays(echeance, maintenant)

  if (joursRestants <= 0) {
    return { actif: true, expire: true, raison: 'QUATRE_MOIS_ECOULES', joursRestants: 0 }
  }
  return { actif: true, expire: false, joursRestants }
}

export const TARIFS: Record<'PRIMARY' | 'SECONDARY', { montant: number; devise: string; periode: string }> = {
  PRIMARY: { montant: 75000, devise: 'FCFA', periode: 'par an, par établissement' },
  SECONDARY: { montant: 120000, devise: 'FCFA', periode: 'par an, par établissement' },
}
