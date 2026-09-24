/**
 * Appels API du module Abonnement · lot A (Boris)
 *
 * Les modes de paiement viennent plus tard (décision explicite du
 * responsable métier) : s'abonner ici ne fait qu'enregistrer le choix et
 * activer l'établissement pour le reste de l'année scolaire, sans
 * intégration bancaire. Ce n'est pas une simulation malhonnête de
 * paiement : c'est un écran qui n'existe pas encore, assumé comme tel.
 */
import { api } from '../../socle/api/client'
import type { Abonnement } from '../../socle/modeles/administration'
import type { StatutEssai } from './calculs'

export async function chargerStatutEssai() {
  const { data } = await api.get<{
    abonnement: Abonnement
    evaluation: StatutEssai
    categorie: 'PRIMARY' | 'SECONDARY'
  }>('/subscription/status')
  return data
}

/**
 * Le plan n'est jamais choisi par l'appelant : il est dérivé côté serveur de
 * la catégorie réelle de l'établissement, pour que la différence de tarif
 * primaire/secondaire ne puisse jamais être contournée par un appel direct.
 */
export async function sabonner() {
  const { data } = await api.post<Abonnement>('/subscription/subscribe')
  return data
}
