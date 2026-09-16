/**
 * Appels API du module Évaluations · lot C (Fabrice)
 *
 * RG-09 : le calcul des moyennes ignore les évaluations non publiées. Une
 * évaluation en brouillon permet à l'enseignant de préparer sa grille sans
 * fausser les moyennes tant qu'il n'a pas relu ses notes.
 *
 * Une évaluation verrouillée hérite du verrouillage de sa période (RG-08) :
 * elle ne se déverrouille pas isolément, c'est la période qui se déverrouille
 * depuis l'écran de Boris, avec motif.
 */
import { api } from '../../socle/api/client'
import type { Evaluation } from '../../socle/modeles/academique'
import type { Page } from '../../socle/modeles/communs'
import { journaliser } from '../../socle/services/journalAudit'

export interface FiltresEvaluations {
  classId?: string
  subjectId?: string
  periodId?: string
  statut?: Evaluation['status'] | ''
  page?: number
  taille?: number
}

export async function listerEvaluations(filtres: FiltresEvaluations) {
  const { data } = await api.get<Page<Evaluation>>('/evaluations', { params: filtres })
  return data
}

export async function chargerEvaluation(id: string) {
  const { data } = await api.get<Evaluation>(`/evaluations/${id}`)
  return data
}

export interface CreationEvaluation {
  classId: string
  subjectId: string
  periodId: string
  title: string
  type: Evaluation['type']
  date: string
  maxGrade: number
  coefficient: number
}

export async function creerEvaluation(corps: CreationEvaluation) {
  const { data } = await api.post<Evaluation>('/evaluations', corps)
  return data
}

/**
 * Publier rend l'évaluation visible dans le calcul des moyennes. C'est une
 * étape volontaire, distincte de la création : tant qu'elle n'est pas prise,
 * l'enseignant peut encore corriger le barème ou le coefficient sans que
 * personne n'ait vu de moyenne provisoire.
 */
export async function publierEvaluation(evaluation: Evaluation) {
  const { data } = await api.patch<Evaluation>(`/evaluations/${evaluation.id}/publish`)
  await journaliser({
    action: 'GRADE_CREATE',
    entityType: 'Evaluation',
    entityId: evaluation.id,
    entityLabel: evaluation.title,
    before: { status: evaluation.status },
    after: { status: 'PUBLISHED' },
  })
  return data
}

export const LIBELLE_TYPE: Record<Evaluation['type'], string> = {
  QUIZ: 'Interrogation',
  HOMEWORK: 'Devoir',
  COMPOSITION: 'Composition',
  EXAM: 'Examen',
  TEST: 'Contrôle',
  PRACTICAL: 'Évaluation pratique',
}

export const LIBELLE_STATUT_EVALUATION: Record<Evaluation['status'], string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publiée',
  LOCKED: 'Verrouillée',
}
