/**
 * Appels API du module Discipline · lot C (Fabrice)
 *
 * RG-14 : les décisions disciplinaires sont journalisées, contrairement aux
 * absences qui n'en font pas partie. Un événement se déclare en deux temps,
 * comme une absence se justifie en deux temps : d'abord le signalement
 * (constat des faits), ensuite la décision (prise par un responsable
 * habilité). Ce ne sont jamais le même geste, ni forcément la même personne.
 *
 * Le bulletin lit ces événements pour son résumé disciplinaire (voir
 * routes-academique.ts, endpoint /report-cards) : c'est la dernière donnée
 * qui y était encore à zéro par manque de module.
 */
import { api } from '../../socle/api/client'
import type { EvenementDisciplinaire } from '../../socle/modeles/academique'
import type { Page } from '../../socle/modeles/communs'
import { journaliser } from '../../socle/services/journalAudit'

export interface FiltresDiscipline {
  classId?: string
  studentId?: string
  severity?: EvenementDisciplinaire['severity'] | ''
  statut?: 'DECIDE' | 'EN_ATTENTE' | ''
  page?: number
  taille?: number
}

export async function listerEvenements(filtres: FiltresDiscipline) {
  const { data } = await api.get<Page<EvenementDisciplinaire>>('/discipline', { params: filtres })
  return data
}

export async function chargerEvenement(id: string) {
  const { data } = await api.get<EvenementDisciplinaire>(`/discipline/${id}`)
  return data
}

export interface SignalementIncident {
  studentId: string
  enrollmentId: string
  classId: string
  date: string
  type: EvenementDisciplinaire['type']
  severity: EvenementDisciplinaire['severity']
  description: string
}

export async function signalerIncident(corps: SignalementIncident) {
  const { data } = await api.post<EvenementDisciplinaire>('/discipline', corps)
  await journaliser({
    action: 'DISCIPLINE_CREATE',
    entityType: 'EvenementDisciplinaire',
    entityId: data.id,
    entityLabel: `${LIBELLE_TYPE[data.type]} · élève ${data.studentId}`,
    after: { type: data.type, severity: data.severity },
  })
  return data
}

/**
 * La décision est distincte du signalement : elle n'existe pas forcément,
 * un événement peut rester en observation sans suite formelle. Quand elle
 * existe, elle est tracée séparément de la déclaration initiale.
 */
export async function statuerSurEvenement(evenement: EvenementDisciplinaire, decision: string) {
  const { data } = await api.patch<EvenementDisciplinaire>(`/discipline/${evenement.id}/decide`, {
    decision,
  })
  await journaliser({
    action: 'DISCIPLINE_DECISION',
    entityType: 'EvenementDisciplinaire',
    entityId: evenement.id,
    entityLabel: `Décision · élève ${evenement.studentId}`,
    before: { decision: evenement.decision ?? null },
    after: { decision },
  })
  return data
}

export const LIBELLE_TYPE: Record<EvenementDisciplinaire['type'], string> = {
  OBSERVATION: 'Observation',
  INCIDENT: 'Incident',
  WARNING: 'Avertissement',
  REPRIMAND: 'Blâme',
  SANCTION: 'Sanction',
  SUSPENSION: 'Exclusion temporaire',
}

export const LIBELLE_GRAVITE: Record<EvenementDisciplinaire['severity'], string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Élevée',
}
