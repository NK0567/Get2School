/**
 * Journalisation des opérations sensibles · PROPRIETAIRE : Boris
 *
 * Boris fournit l'outil, chaque lot l'appelle depuis ses propres services.
 * RG-14 : note, déverrouillage, opération financiere, permission, décision
 * disciplinaire, archivage et génération de document sont journalises.
 */
import { api } from '../api/client'
import type { ActionAudit } from '../modeles/administration'
import { useSession } from '../etat/useSession'

export interface DemandeJournalisation {
  action: ActionAudit
  entityType: string
  entityId: string
  entityLabel: string
  before?: unknown
  after?: unknown
}

export async function journaliser(demande: DemandeJournalisation) {
  const utilisateur = useSession.getState().utilisateur
  try {
    await api.post('/audit-logs', {
      ...demande,
      before: demande.before ?? null,
      after: demande.after ?? null,
      userId: utilisateur?.id ?? 'inconnu',
      userLabel: utilisateur ? `${utilisateur.firstName} ${utilisateur.lastName}` : 'Inconnu',
    })
  } catch {
    // La journalisation ne doit jamais faire echouer l'action métier.
  }
}
