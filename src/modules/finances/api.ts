/**
 * Appels API du module Finance · lot B (Alida)
 *
 * RG : un paiement ne se supprime jamais, il s'annule avec motif obligatoire
 * (comme une note sanctionnée ou une absence justifiée ailleurs dans le
 * projet) — le reçu déjà remis à une famille doit pouvoir être invalidé sans
 * disparaître des archives. L'annulation d'un paiement est une opération
 * sensible, journalisée (RG-14).
 *
 * SituationFinanciere n'est jamais stockée : elle est recalculée à chaque
 * demande par le serveur, avec exactement le même moteur que celui testé à
 * part (modules/finances/calculs.ts).
 */
import { api } from '../../socle/api/client'
import type { Exoneration, Frais, Paiement, Recu, SituationFinanciere } from '../../socle/modeles/finances'
import { journaliser } from '../../socle/services/journalAudit'

/* ── Frais ────────────────────────────────────────────── */

export async function listerFrais() {
  const { data } = await api.get<Frais[]>('/finance/fees')
  return data
}

export interface CreationTranche {
  label: string
  amount: number
  dueDate: string
}

export interface CreationFrais {
  label: string
  scope: Frais['scope']
  scopeRef?: string
  amount: number
  isMandatory: boolean
  installments: CreationTranche[]
}

export async function creerFrais(corps: CreationFrais) {
  const { data } = await api.post<Frais>('/finance/fees', corps)
  return data
}

/* ── Exonérations ─────────────────────────────────────── */

export async function listerExonerations(studentId?: string) {
  const { data } = await api.get<Exoneration[]>('/finance/exemptions', { params: { studentId } })
  return data
}

export async function accorderExoneration(studentId: string, reason: string, feeItemId?: string) {
  const { data } = await api.post<Exoneration>('/finance/exemptions', { studentId, reason, feeItemId })
  await journaliser({
    action: 'EXEMPTION_GRANT',
    entityType: 'Exoneration',
    entityId: data.id,
    entityLabel: `Exonération · élève ${data.studentId}${data.feeItemId ? ` · frais ${data.feeItemId}` : ' · tous frais'}`,
    after: { reason: data.reason, feeItemId: data.feeItemId ?? null },
  })
  return data
}

/* ── Paiements ────────────────────────────────────────── */

export interface FiltresPaiements {
  studentId?: string
  classId?: string
  status?: Paiement['status'] | ''
}

export async function listerPaiements(filtres: FiltresPaiements) {
  const { data } = await api.get<Paiement[]>('/finance/payments', { params: filtres })
  return data
}

export interface SaisiePaiement {
  studentId: string
  enrollmentId: string
  feeItemId: string
  installmentId?: string
  amount: number
  method: Paiement['method']
  externalRef?: string
}

/** Enregistrer un paiement produit toujours un reçu, dans le même geste. */
export async function enregistrerPaiement(corps: SaisiePaiement) {
  const { data } = await api.post<{ paiement: Paiement; recu: Recu }>('/finance/payments', corps)
  await journaliser({
    action: 'PAYMENT_CREATE',
    entityType: 'Paiement',
    entityId: data.paiement.id,
    entityLabel: `${data.paiement.reference} · élève ${data.paiement.studentId}`,
    after: { amount: data.paiement.amount, method: data.paiement.method },
  })
  return data
}

export async function annulerPaiement(paiement: Paiement, motif: string) {
  const { data } = await api.patch<Paiement>(`/finance/payments/${paiement.id}/cancel`, { motif })
  await journaliser({
    action: 'PAYMENT_CANCEL',
    entityType: 'Paiement',
    entityId: paiement.id,
    entityLabel: `${paiement.reference} · élève ${paiement.studentId}`,
    before: { status: paiement.status },
    after: { status: 'CANCELLED', motif },
  })
  return data
}

/* ── Situation financière ─────────────────────────────── */

export async function chargerSituation(studentId: string) {
  const { data } = await api.get<SituationFinanciere>(`/finance/situation/${studentId}`)
  return data
}

export interface LigneSituationClasse extends SituationFinanciere {
  matricule: string
  fullName: string
}

export async function chargerSituationClasse(classId: string) {
  const { data } = await api.get<LigneSituationClasse[]>('/finance/situation', { params: { classId } })
  return data
}

export const LIBELLE_METHODE: Record<Paiement['method'], string> = {
  CASH: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Virement bancaire',
  CHECK: 'Chèque',
}

export const LIBELLE_STATUT_FINANCIER: Record<SituationFinanciere['status'], string> = {
  PAID: 'Soldé',
  PARTIAL: 'Partiel',
  UNPAID: 'Impayé',
  EXEMPT: 'Exonéré',
}

export const LIBELLE_PORTEE_FRAIS: Record<Frais['scope'], string> = {
  ALL: "Tout l'établissement",
  LEVEL: 'Un niveau',
  CLASS: 'Une classe',
}
