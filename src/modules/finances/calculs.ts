/**
 * Moteur de calcul financier · lot B (Alida)
 *
 * Fonctions pures, même principe que modules/notes/calculs.ts : aucun accès
 * au stockage, testées seules, réutilisées telles quelles côté simulation.
 * SituationFinanciere n'est JAMAIS stockée en base (voir le commentaire du
 * modèle) : elle se recalcule à chaque consultation à partir des frais, des
 * exonérations et des paiements, qui eux seuls sont la vérité.
 *
 * Convention retenue, faute de contrainte plus stricte dans le modèle : la
 * somme des tranches d'un Frais est censée égaler son montant total. Un
 * frais sans échéancier explicite est traité comme une tranche unique
 * exigible à sa propre date de création (aucune date d'échéance n'existe
 * alors, il n'entre donc jamais dans le calcul de retard).
 */
import type { Exoneration, Frais, Paiement, StatutFinancier } from '../../socle/modeles/finances'

export interface EleveConcerne {
  classId: string
  level: string
}

/** RG : un frais s'applique selon sa portée (établissement, niveau ou classe). */
export function fraisApplicables(frais: Frais[], eleve: EleveConcerne): Frais[] {
  return frais.filter((f) => {
    if (f.scope === 'ALL') return true
    if (f.scope === 'LEVEL') return f.scopeRef === eleve.level
    if (f.scope === 'CLASS') return f.scopeRef === eleve.classId
    return false
  })
}

export function estExonere(frais: Frais, exonerations: Exoneration[], studentId: string): boolean {
  return exonerations.some((e) => e.studentId === studentId && (!e.feeItemId || e.feeItemId === frais.id))
}

export interface ParametresSituation {
  fraisDuStudent: Frais[]
  exonerations: Exoneration[]
  paiements: Paiement[]
  studentId: string
  schoolYearId: string
  aujourdHui: Date
}

export function calculerSituationFinanciere(p: ParametresSituation): {
  due: number
  paid: number
  balance: number
  status: StatutFinancier
  isOverdue: boolean
  nextDueDate?: string
} {
  const fraisRetenus = p.fraisDuStudent.filter((f) => !estExonere(f, p.exonerations, p.studentId))

  const due = fraisRetenus.reduce((s, f) => s + f.amount, 0)
  const paid = p.paiements
    .filter((pay) => pay.studentId === p.studentId && pay.status === 'VALID')
    .reduce((s, pay) => s + pay.amount, 0)
  const balance = due - paid

  const status: StatutFinancier =
    due === 0 ? 'EXEMPT' : paid >= due ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID'

  // Échéancier global : toutes les tranches de tous les frais retenus,
  // triées par date, avec le montant cumulé attendu à chaque étape.
  const tranches = fraisRetenus
    .flatMap((f) => f.installments)
    .filter((t) => t.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  let cumulAttendu = 0
  let isOverdue = false
  let nextDueDate: string | undefined

  for (const tranche of tranches) {
    cumulAttendu += tranche.amount
    const estEchue = new Date(tranche.dueDate) < p.aujourdHui
    const estCouverte = paid >= cumulAttendu

    if (!estCouverte) {
      if (estEchue) isOverdue = true
      if (nextDueDate === undefined) nextDueDate = tranche.dueDate
    }
  }

  return { due, paid, balance, status, isOverdue, nextDueDate }
}

/** Pourcentage d'élèves à jour (PAID ou EXEMPT) dans un ensemble de situations. */
export function tauxSolvabilite(situations: { status: StatutFinancier }[]): number | null {
  if (situations.length === 0) return null
  const aJour = situations.filter((s) => s.status === 'PAID' || s.status === 'EXEMPT').length
  return (aJour / situations.length) * 100
}
