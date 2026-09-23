/**
 * Appels API du module Journal d'audit · lot A (Boris)
 *
 * RG-14  Les opérations sensibles sont journalisées.
 * RG-15  Le journal est en lecture seule. Aucun écran, aucun rôle, aucun
 *        endpoint ne permet de modifier ni de supprimer une entrée.
 *
 * ┌─ POINT D'ARCHITECTURE À REPRENDRE AVANT LA MISE EN PRODUCTION ─────────┐
 * │ Dans cette version, l'entrée d'audit est écrite par le navigateur,     │
 * │ après l'opération métier. Ce n'est pas fiable : un client peut ne pas  │
 * │ l'envoyer, et l'opération peut réussir sans être tracée.               │
 * │                                                                        │
 * │ En production, l'entrée doit être écrite par Spring Boot DANS LA MÊME  │
 * │ TRANSACTION que l'opération métier, via un intercepteur ou un aspect.  │
 * │ Le client n'écrit alors plus rien : il ne fait que lire le journal.    │
 * │ Voir docs/audit-production.md.                                         │
 * └────────────────────────────────────────────────────────────────────────┘
 */
import { api } from '../../socle/api/client'
import type { ActionAudit, EntreeAudit } from '../../socle/modeles/administration'
import type { Page } from '../../socle/modeles/communs'

export interface FiltresAudit {
  action?: ActionAudit | ''
  userId?: string
  entityType?: string
  du?: string
  au?: string
  page?: number
  taille?: number
}

export async function listerEntrees(filtres: FiltresAudit) {
  const { data } = await api.get<Page<EntreeAudit>>('/audit-logs', { params: filtres })
  return data
}

/** Regroupement par catégorie, pour le filtre déroulant. */
export const CATEGORIES_ACTION: { libelle: string; actions: ActionAudit[] }[] = [
  {
    libelle: 'Accès et sécurité',
    actions: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'ACCESS_DENIED'],
  },
  {
    libelle: 'Comptes et permissions',
    actions: [
      'USER_CREATE',
      'USER_UPDATE',
      'USER_ROLE_CHANGE',
      'USER_ACTIVATE',
      'USER_DEACTIVATE',
      'PERMISSION_CHANGE',
    ],
  },
  {
    libelle: 'Années et périodes',
    actions: ['YEAR_OPEN', 'YEAR_CLOSE', 'PERIOD_LOCK', 'PERIOD_UNLOCK'],
  },
  {
    libelle: 'Notes',
    actions: ['GRADE_CREATE', 'GRADE_UPDATE', 'GRADE_CANCEL'],
  },
  {
    libelle: 'Opérations financières',
    actions: ['PAYMENT_CREATE', 'PAYMENT_CANCEL', 'FEE_UPDATE', 'EXEMPTION_GRANT'],
  },
  {
    libelle: 'Scolarité et discipline',
    actions: ['STUDENT_ARCHIVE', 'ENROLLMENT_TRANSFER', 'DISCIPLINE_CREATE', 'DISCIPLINE_DECISION'],
  },
  {
    libelle: 'Documents et communication',
    actions: ['DOCUMENT_GENERATE', 'ANNOUNCEMENT_PUBLISH', 'ANNOUNCEMENT_WITHDRAW'],
  },
]

export const LIBELLE_ACTION: Record<ActionAudit, string> = {
  LOGIN_SUCCESS: 'Connexion réussie',
  LOGIN_FAILED: 'Échec de connexion',
  LOGOUT: 'Déconnexion',
  ACCESS_DENIED: 'Accès refusé',
  USER_CREATE: "Création d'un compte",
  USER_UPDATE: "Modification d'un compte",
  USER_ROLE_CHANGE: 'Changement de rôle',
  USER_ACTIVATE: "Activation d'un compte",
  USER_DEACTIVATE: "Désactivation d'un compte",
  PERMISSION_CHANGE: 'Modification de permissions',
  YEAR_OPEN: "Ouverture d'une année scolaire",
  YEAR_CLOSE: "Clôture d'une année scolaire",
  PERIOD_LOCK: "Verrouillage d'une période",
  PERIOD_UNLOCK: "Déverrouillage d'une période",
  GRADE_CREATE: "Saisie d'une note",
  GRADE_UPDATE: "Modification d'une note",
  GRADE_CANCEL: "Sanction d'une note",
  PAYMENT_CREATE: "Enregistrement d'un paiement",
  PAYMENT_CANCEL: "Annulation d'un paiement",
  FEE_UPDATE: 'Modification des frais',
  EXEMPTION_GRANT: "Octroi d'une exonération",
  DISCIPLINE_CREATE: "Déclaration d'un incident",
  DISCIPLINE_DECISION: 'Décision disciplinaire',
  DOCUMENT_GENERATE: "Génération d'un document",
  ANNOUNCEMENT_PUBLISH: "Publication d'une annonce",
  ANNOUNCEMENT_WITHDRAW: "Retrait d'une annonce",
  STUDENT_ARCHIVE: "Archivage d'un élève",
  ENROLLMENT_TRANSFER: "Transfert d'une inscription",
}

/** Actions qui méritent d'être signalées visuellement dans la liste. */
export const ACTIONS_CRITIQUES: ActionAudit[] = [
  'PERIOD_UNLOCK',
  'GRADE_UPDATE',
  'GRADE_CANCEL',
  'PAYMENT_CANCEL',
  'PERMISSION_CHANGE',
  'ACCESS_DENIED',
  'LOGIN_FAILED',
]
