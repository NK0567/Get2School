/**
 * Déclenchement de notifications depuis un événement métier · PROPRIÉTAIRE : Boris
 *
 * Boris fournit l'outil, chaque lot l'appelle depuis ses propres services.
 * Le catalogue ci-dessous est commun aux trois lots : ajoutez-y votre type
 * plutôt que d'inventer une chaîne libre, sinon le centre de notifications
 * devient impossible à filtrer.
 *
 * RÈGLE DE CONFIDENTIALITÉ : une notification ne transporte jamais de donnée
 * sensible. On écrit « Le bulletin du 1er trimestre est disponible », jamais
 * la moyenne. On écrit « Une échéance est dépassée », jamais le montant. Une
 * notification s'affiche sur un écran de veille, dans une liste partagée, et
 * sera un jour poussée par courrier ou par SMS.
 */
import { api } from '../api/client'

export const TYPES_NOTIFICATION = {
  ANNONCE_PUBLIEE: "Publication d'une annonce",
  RESULTATS_PUBLIES: 'Publication de résultats',
  PERIODE_VERROUILLEE: "Verrouillage d'une période",
  ANNEE_OUVERTE: "Ouverture d'une année scolaire",
  ECHEANCE_DEPASSEE: 'Échéance de paiement dépassée',
  INCIDENT_GRAVE: 'Incident disciplinaire grave',
  DOCUMENT_PRET: 'Document disponible',
  COMPTE_CREE: "Création d'un compte",
} as const

export type TypeNotification = keyof typeof TYPES_NOTIFICATION

export interface DemandeNotification {
  /** Identifiants des comptes destinataires. */
  destinataires: string[]
  type: TypeNotification
  titre: string
  /** Message court, sans donnée sensible. */
  corps: string
  /** Route ouverte au clic sur la notification. */
  lien?: string
}

export async function notifier(demande: DemandeNotification) {
  try {
    await api.post('/notifications', demande)
  } catch {
    // Une notification perdue ne doit jamais faire échouer l'action métier
    // qui l'a déclenchée. En production, l'envoi passe par une file de
    // messages qui garantit la reprise.
  }
}
