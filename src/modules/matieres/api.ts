/**
 * Appels API du module Matières · lot B (Alida)
 *
 * Le coefficient d'une matière pondère les moyennes matière dans le calcul
 * de la moyenne générale (moyenneGenerale, dans modules/notes/calculs.ts).
 * Le modifier change donc rétroactivement le poids de toutes les moyennes
 * déjà calculées pour les périodes passées, pas seulement les nouvelles —
 * ces fonctions sont pures et relisent toujours l'état courant de la
 * matière, jamais une valeur figée au moment de la note. C'est signalé à
 * l'écran d'édition, ce n'est pas bloqué : modifier un coefficient reste une
 * décision de l'établissement.
 *
 * Une matière ne se supprime pas si des évaluations y sont rattachées : on
 * la désactive, ce qui la retire des sélecteurs de création sans toucher à
 * l'historique.
 */
import { api } from '../../socle/api/client'
import type { Matiere } from '../../socle/modeles/scolarite'

export async function listerMatieres() {
  const { data } = await api.get<Matiere[]>('/subjects')
  return data
}

export interface CreationMatiere {
  name: string
  code: string
  coefficient: number
  maxGrade: number
}

export async function creerMatiere(corps: CreationMatiere) {
  const { data } = await api.post<Matiere>('/subjects', corps)
  return data
}

export interface ModificationMatiere {
  name: string
  coefficient: number
  maxGrade: number
}

export async function modifierMatiere(matiere: Matiere, modifs: ModificationMatiere) {
  const { data } = await api.put<Matiere>(`/subjects/${matiere.id}`, modifs)
  return data
}

export async function changerStatutMatiere(matiere: Matiere, actif: boolean) {
  const { data } = await api.patch<Matiere>(`/subjects/${matiere.id}/status`, { isActive: actif })
  return data
}
