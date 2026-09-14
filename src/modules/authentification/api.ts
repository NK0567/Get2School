/**
 * Appels API du module Authentification · lot A (Boris)
 *
 * Deux principes de sécurité s'appliquent à tout ce fichier.
 *
 * 1. Aucun message ne révèle si une adresse existe. Une connexion échouée et
 *    une demande de réinitialisation renvoient la même réponse, que le compte
 *    existe ou non. Dans le cas contraire, le formulaire devient un outil
 *    d'énumération des comptes de l'établissement.
 *
 * 2. Les décisions appartiennent au serveur. Le verrouillage après échecs
 *    répétés, la validité d'un jeton et la politique de mot de passe sont
 *    contrôlés côté Spring Boot. Ce qui est fait ici ne sert qu'à guider.
 */
import { api } from '../../socle/api/client'
import type { Utilisateur } from '../../socle/modeles/administration'

export interface ReponseConnexion {
  jeton: string
  utilisateur: Utilisateur
  /** Horodatage d'expiration du jeton, en ISO. */
  expireLe: string
}

export async function connexion(email: string, motDePasse: string) {
  const { data } = await api.post<ReponseConnexion>('/auth/login', { email, motDePasse })
  return data
}

export async function deconnexion() {
  await api.post('/auth/logout')
}

/**
 * Renvoie toujours un succès, y compris si l'adresse est inconnue.
 * Le message affiché est volontairement identique dans les deux cas.
 */
export async function demanderReinitialisation(email: string) {
  await api.post('/auth/password/forgot', { email })
}

export async function verifierJetonReinitialisation(jeton: string) {
  const { data } = await api.get<{ valide: boolean; email?: string }>(`/auth/password/reset/${jeton}`)
  return data
}

export async function reinitialiserMotDePasse(jeton: string, motDePasse: string) {
  await api.post('/auth/password/reset', { jeton, motDePasse })
}

export async function changerMotDePasse(ancien: string, nouveau: string) {
  await api.put('/auth/password', { ancien, nouveau })
}

export interface SessionActive {
  id: string
  appareil: string
  adresseIp: string
  derniereActivite: string
  courante: boolean
}

export async function listerSessions() {
  const { data } = await api.get<SessionActive[]>('/auth/sessions')
  return data
}

export async function revoquerSession(id: string) {
  await api.delete(`/auth/sessions/${id}`)
}
