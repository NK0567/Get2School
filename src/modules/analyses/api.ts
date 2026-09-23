/**
 * Appels API du module Élèves à risque · lot C (Fabrice)
 *
 * RG-16 : aucune recommandation algorithmique ne déclenche d'action
 * automatique. Ce module signale des dossiers à examiner, il ne décide
 * jamais rien. Le bandeau d'avertissement est obligatoire sur l'écran, pas
 * une option d'affichage : voir pages/ElevesARisque.tsx.
 */
import { api } from '../../socle/api/client'

export type NiveauRisque = 'LOW' | 'MEDIUM' | 'HIGH'

export interface FacteursRisque {
  average: number
  trend: number
  absence: number
  discipline: number
}

export interface ScoreRisqueEleve {
  enrollmentId: string
  studentId: string
  matricule: string
  fullName: string
  score: number
  level: NiveauRisque
  factors: FacteursRisque
  generalAverage: number | null
}

export async function chargerElevesARisque(classId: string, periodId: string) {
  const { data } = await api.get<ScoreRisqueEleve[]>('/analytics/at-risk', {
    params: { classId, periodId },
  })
  return data
}

export const LIBELLE_NIVEAU: Record<NiveauRisque, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyen',
  HIGH: 'Élevé',
}

/* ── Évolution des apprenants ────────────────────────────── */

/**
 * Point d'évolution d'une période. `studentAverage` n'est présent que si un
 * élève a été demandé pour comparaison ; sinon c'est la seule courbe de
 * classe qui s'affiche.
 *
 * Portée assumée : cette courbe est à la maille de la période (un point par
 * trimestre ou semestre), pas à la maille de l'évaluation individuelle. Le
 * calcul par période réutilise exactement celui déjà testé pour les
 * bulletins et l'indicateur de risque, plutôt que d'introduire un second
 * mode de calcul plus fin mais non vérifié.
 */
export interface PointEvolution {
  periodId: string
  periodLabel: string
  classAverage: number | null
  passRate: number | null
  studentAverage: number | null
}

export interface EleveDeLaClasse {
  enrollmentId: string
  fullName: string
  matricule: string
}

export interface EvolutionClasse {
  points: PointEvolution[]
  eleves: EleveDeLaClasse[]
}

export async function chargerEvolutionClasse(classId: string, enrollmentId?: string) {
  const { data } = await api.get<EvolutionClasse>('/analytics/class-evolution', {
    params: { classId, enrollmentId },
  })
  return data
}
