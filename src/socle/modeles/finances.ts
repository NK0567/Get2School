/**
 * Modèles financiers du lot B · PROPRIETAIRE : Alida
 * Boris et Fabrice : lecture seule.
 */
import type { EntiteEtablissement } from './communs'

export interface Tranche {
  id: string
  feeItemId: string
  label: string
  amount: number
  dueDate: string
}

export interface Frais extends EntiteEtablissement {
  schoolYearId: string
  label: string
  scope: 'ALL' | 'LEVEL' | 'CLASS'
  scopeRef?: string
  amount: number
  isMandatory: boolean
  installments: Tranche[]
}

export interface Exoneration extends EntiteEtablissement {
  studentId: string
  schoolYearId: string
  feeItemId?: string
  reason: string
  grantedBy: string
  grantedAt: string
}

export interface Paiement extends EntiteEtablissement {
  reference: string
  studentId: string
  enrollmentId: string
  feeItemId: string
  installmentId?: string
  amount: number
  method: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CHECK'
  externalRef?: string
  paidAt: string
  recordedBy: string
  status: 'VALID' | 'CANCELLED'
  cancelReason?: string
}

export interface Recu extends EntiteEtablissement {
  number: string
  paymentId: string
  studentId: string
  amount: number
  issuedAt: string
  issuedBy: string
  status: 'VALID' | 'CANCELLED'
}

export type StatutFinancier = 'PAID' | 'PARTIAL' | 'UNPAID' | 'EXEMPT'

/** Résultat de calcul, jamais stocke en base. */
export interface SituationFinanciere {
  studentId: string
  schoolYearId: string
  due: number
  paid: number
  balance: number
  status: StatutFinancier
  isOverdue: boolean
  nextDueDate?: string
}
