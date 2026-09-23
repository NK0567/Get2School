/**
 * Appels API du module Inscriptions · lot B (Alida)
 *
 * RG-04 : un élève a au plus une inscription active par année scolaire, et
 * un historique illimité. La réinscription ne modifie jamais l'inscription
 * de l'année précédente : elle en crée une nouvelle sur l'année ouverte,
 * dans une nouvelle classe, avec isRenewal à vrai.
 *
 * Le transfert traité ici est un mouvement interne, d'une classe à une
 * autre au sein de la même année scolaire. Un départ vers un autre
 * établissement passe par l'archivage du dossier élève (module Élèves) :
 * ce n'est pas dupliqué ici.
 */
import { api } from '../../socle/api/client'
import type { Inscription } from '../../socle/modeles/scolarite'
import { journaliser } from '../../socle/services/journalAudit'

export interface FiltresInscriptions {
  classId?: string
  status?: Inscription['status'] | ''
}

export async function listerInscriptions(filtres: FiltresInscriptions) {
  const { data } = await api.get<Inscription[]>('/enrollments', { params: { ...filtres, tout: 'true' } })
  return data
}

export async function reinscrire(studentId: string, classId: string) {
  const { data } = await api.post<Inscription>('/enrollments/renew', { studentId, classId })
  return data
}

export async function transfererVersClasse(inscription: Inscription, classIdCible: string) {
  const { data } = await api.patch<Inscription>(`/enrollments/${inscription.id}/transfer-class`, {
    classIdCible,
  })
  await journaliser({
    action: 'ENROLLMENT_TRANSFER',
    entityType: 'Inscription',
    entityId: data.id,
    entityLabel: `Élève ${data.studentId}`,
    before: { classId: inscription.classId },
    after: { classId: data.classId },
  })
  return data
}

export const LIBELLE_STATUT_INSCRIPTION: Record<Inscription['status'], string> = {
  ACTIVE: 'Active',
  TRANSFERRED: 'Transférée',
  DROPPED: 'Abandon',
  COMPLETED: 'Terminée',
}
