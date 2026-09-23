/**
 * Appels API du module Inscription établissement · lot A (Boris)
 *
 * C'est le seul endroit de tout le projet où un compte ET un établissement
 * se créent dans le même geste, sans qu'aucun jeton n'existe encore. Le
 * compte créé ici est TOUJOURS SCHOOL_ADMIN : celui qui inscrit son
 * établissement en devient le premier responsable, de la même manière que
 * dans n'importe quel SaaS. Le reste de l'équipe se constitue à l'étape
 * suivante, une fois connecté (module Équipe fondatrice).
 */
import { api } from '../../socle/api/client'
import type { Etablissement, Utilisateur } from '../../socle/modeles/administration'

export interface InscriptionEtablissement {
  // Établissement
  name: string
  category: Etablissement['category']
  theme: Etablissement['theme']
  slogan?: string
  logoUrl?: string
  address: string
  phone: string
  email: string
  // Premier compte (le responsable inscrit)
  directorFirstName: string
  directorLastName: string
  directorEmail: string
  directorPassword: string
}

export interface ReponseInscription {
  etablissement: Etablissement
  utilisateur: Utilisateur
  jeton: string
}

export async function inscrireEtablissement(corps: InscriptionEtablissement) {
  const { data } = await api.post<ReponseInscription>('/auth/signup', corps)
  return data
}

export async function codeDisponible(nom: string) {
  const { data } = await api.get<{ disponible: boolean; codeSuggere: string }>('/auth/signup/check-code', {
    params: { nom },
  })
  return data
}

export const LIBELLE_CATEGORIE: Record<Etablissement['category'], string> = {
  PRIMARY: 'École primaire',
  SECONDARY: 'Collège / Lycée',
}

export const LIBELLE_THEME: Record<Etablissement['theme'], string> = {
  BLEU: 'Bleu classique',
  VERT: 'Vert institutionnel',
  BORDEAUX: 'Bordeaux traditionnel',
  VIOLET: 'Violet moderne',
}

export const COULEUR_THEME: Record<Etablissement['theme'], string> = {
  BLEU: '#1d4ed8',
  VERT: '#15803d',
  BORDEAUX: '#9f1239',
  VIOLET: '#6d28d9',
}
