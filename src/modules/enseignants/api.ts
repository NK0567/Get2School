/**
 * Appels API du module Enseignants · lot B (Alida)
 *
 * Un enseignant n'a pas forcément de compte de connexion (userId facultatif) :
 * on peut créer sa fiche avant que Boris ne lui ouvre un accès depuis le
 * module Utilisateurs. Les deux restent volontairement découplés, comme le
 * modèle le prévoit déjà.
 *
 * Un enseignant ne se supprime pas s'il porte des affectations actives :
 * on le désactive, ce qui le retire des sélecteurs sans effacer son
 * historique (matières déjà enseignées, notes déjà saisies restent
 * attribuées à son nom).
 */
import { api } from '../../socle/api/client'
import type { Enseignant } from '../../socle/modeles/scolarite'

export interface FiltresEnseignants {
  recherche?: string
  subjectId?: string
  actif?: string
}

export async function listerEnseignants(filtres: FiltresEnseignants) {
  const { data } = await api.get<Enseignant[]>('/teachers', { params: filtres })
  return data
}

export async function chargerEnseignant(id: string) {
  const { data } = await api.get<Enseignant>(`/teachers/${id}`)
  return data
}

export interface CreationEnseignant {
  firstName: string
  lastName: string
  phone: string
  email?: string
  subjectIds: string[]
  hireDate?: string
}

export async function creerEnseignant(corps: CreationEnseignant) {
  const { data } = await api.post<Enseignant>('/teachers', corps)
  return data
}

export interface ModificationEnseignant {
  phone: string
  email?: string
  subjectIds: string[]
}

export async function modifierEnseignant(enseignant: Enseignant, modifs: ModificationEnseignant) {
  const { data } = await api.put<Enseignant>(`/teachers/${enseignant.id}`, modifs)
  return data
}

export async function changerStatutEnseignant(enseignant: Enseignant, actif: boolean) {
  const { data } = await api.patch<Enseignant>(`/teachers/${enseignant.id}/status`, { isActive: actif })
  return data
}
