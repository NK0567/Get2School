/**
 * Appels API du module Affectations · lot B (Alida)
 *
 * Une affectation est un simple lien (enseignant, matière, classe) sur
 * l'année scolaire ouverte. Contrairement aux notes ou aux paiements, elle
 * ne porte aucune donnée à préserver pour l'audit : la supprimer ne
 * retire rien de l'historique déjà produit (les évaluations et notes déjà
 * créées restent attribuées à leur auteur), elle ferme seulement la
 * possibilité d'en créer de nouvelles sur ce couple classe/matière.
 *
 * C'est ce lien que lit modules/notes/calculs et le filtrage par rôle du
 * lot C (routes-academique.ts, fonction estAffecte) pour cloisonner un
 * enseignant à ses propres classes et matières.
 */
import { api } from '../../socle/api/client'
import type { Affectation } from '../../socle/modeles/scolarite'

export interface FiltresAffectations {
  classId?: string
  teacherId?: string
  subjectId?: string
}

export async function listerAffectations(filtres: FiltresAffectations) {
  const { data } = await api.get<Affectation[]>('/assignments', { params: filtres })
  return data
}

export interface CreationAffectation {
  teacherId: string
  subjectId: string
  classId: string
}

export async function creerAffectation(corps: CreationAffectation) {
  const { data } = await api.post<Affectation>('/assignments', corps)
  return data
}

export async function retirerAffectation(id: string) {
  await api.delete(`/assignments/${id}`)
}
