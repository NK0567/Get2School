/**
 * Appels API du module Chronogramme · lot A (Boris), sur la collection
 * evenementsPlanifies du lot C
 *
 * Le modèle EvenementPlanifie existait déjà (socle/modeles/academique.ts,
 * pensé pour le Planning des évaluations du lot C) mais rien ne l'utilisait
 * pour les autres genres d'événements qu'il prévoit pourtant : réunions,
 * activités, échéances, congés. Ce module comble ce manque plutôt que de
 * dupliquer un second modèle d'événement. Les routes simulées vivent dans
 * routes-academique.ts, là où la collection est déjà semée — pas une
 * question d'appartenance de lot, une question de ne pas déplacer une
 * collection existante sans raison.
 */
import { api } from '../../socle/api/client'
import type { EvenementPlanifie } from '../../socle/modeles/academique'

export interface FiltresChronogramme {
  periodId?: string
}

export async function listerEvenements(filtres: FiltresChronogramme) {
  const { data } = await api.get<EvenementPlanifie[]>('/planned-events', { params: filtres })
  return data
}

export interface CreationEvenement {
  kind: EvenementPlanifie['kind']
  title: string
  startDate: string
  endDate?: string
  periodId?: string
  classId?: string
  description?: string
}

export async function creerEvenement(corps: CreationEvenement) {
  const { data } = await api.post<EvenementPlanifie>('/planned-events', corps)
  return data
}

export async function supprimerEvenement(id: string) {
  await api.delete(`/planned-events/${id}`)
}

export const LIBELLE_GENRE: Record<EvenementPlanifie['kind'], string> = {
  EVALUATION: 'Évaluation',
  MEETING: 'Réunion',
  ACTIVITY: 'Activité',
  DEADLINE: 'Échéance',
  HOLIDAY: 'Congé',
}
