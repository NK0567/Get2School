/**
 * Appels API du module Annonces · lot A (Boris)
 *
 * Une annonce publiée n'est plus modifiable. Elle a été distribuée à ses
 * destinataires : la corriger après coup produirait deux versions d'un même
 * message selon le moment où chacun l'a lue. Une annonce erronée se retire,
 * et une nouvelle est publiée.
 */
import { api } from '../../socle/api/client'
import type { Annonce } from '../../socle/modeles/administration'
import type { Page } from '../../socle/modeles/communs'
import { journaliser } from '../../socle/services/journalAudit'

export interface FiltresAnnonces {
  statut?: string
  priorite?: string
  page?: number
  taille?: number
}

export async function listerAnnonces(filtres: FiltresAnnonces) {
  const { data } = await api.get<Page<Annonce>>('/announcements', { params: filtres })
  return data
}

export async function chargerAnnonce(id: string) {
  const { data } = await api.get<Annonce>(`/announcements/${id}`)
  return data
}

export interface RedactionAnnonce {
  title: string
  body: string
  audienceType: Annonce['audienceType']
  audienceRefs: string[]
  priority: Annonce['priority']
}

/** Nombre de destinataires, calculé par le serveur avant publication. */
export async function compterDestinataires(audienceType: Annonce['audienceType'], audienceRefs: string[]) {
  const { data } = await api.post<{ nombre: number; apercu: string[] }>('/announcements/audience', {
    audienceType,
    audienceRefs,
  })
  return data
}

export async function enregistrerBrouillon(redaction: RedactionAnnonce) {
  const { data } = await api.post<Annonce>('/announcements', redaction)
  return data
}

export async function publierAnnonce(id: string) {
  const { data } = await api.patch<Annonce>(`/announcements/${id}/publish`)
  await journaliser({
    action: 'ANNOUNCEMENT_PUBLISH',
    entityType: 'Annonce',
    entityId: data.id,
    entityLabel: data.title,
    after: { audienceType: data.audienceType, priority: data.priority },
  })
  return data
}

export async function retirerAnnonce(annonce: Annonce, motif: string) {
  const { data } = await api.patch<Annonce>(`/announcements/${annonce.id}/withdraw`, { motif })
  await journaliser({
    action: 'ANNOUNCEMENT_PUBLISH',
    entityType: 'Annonce',
    entityId: annonce.id,
    entityLabel: `Retrait · ${annonce.title}`,
    before: { status: annonce.status },
    after: { status: 'WITHDRAWN', motif },
  })
  return data
}

export const LIBELLE_AUDIENCE: Record<Annonce['audienceType'], string> = {
  ALL_STAFF: "Tout le personnel de l'établissement",
  ALL_TEACHERS: 'Tous les enseignants',
  CLASS: "Les enseignants d'une classe",
  LEVEL: "Les enseignants d'un niveau",
  CUSTOM_GROUP: 'Une sélection de comptes',
}

export const LIBELLE_PRIORITE: Record<Annonce['priority'], string> = {
  NORMAL: 'Normale',
  HIGH: 'Importante',
  URGENT: 'Urgente',
}
