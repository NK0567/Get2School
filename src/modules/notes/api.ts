/**
 * Appels API du module Notes · lot C (Fabrice)
 *
 * RG-07  une note ne se supprime pas : elle se corrige (avec trace) ou se
 *        sanctionne (avec motif obligatoire).
 * RG-08  une période verrouillée interdit toute modification de note.
 */
import { api } from '../../socle/api/client'
import type { Note } from '../../socle/modeles/academique'
import { journaliser } from '../../socle/services/journalAudit'

export async function listerNotes(evaluationId: string) {
  const { data } = await api.get<Note[]>(`/evaluations/${evaluationId}/grades`)
  return data
}

export interface SaisieNote {
  studentId: string
  enrollmentId: string
  value: number | null
  status: Note['status']
}

/**
 * Enregistrement en lot de la grille de saisie. Chaque ligne modifiée génère
 * sa propre entrée d'audit côté serveur : le client n'a qu'à envoyer l'état
 * final de la grille.
 */
export async function enregistrerNotes(evaluationId: string, saisies: SaisieNote[]) {
  const { data } = await api.put<Note[]>(`/evaluations/${evaluationId}/grades`, { saisies })
  return data
}

/**
 * Sanctionner une note avec motif obligatoire. Elle reste visible, barrée,
 * jamais supprimée. Une note sanctionnée vaut toujours 0, coefficient
 * compris : ce n'est pas un réglage d'établissement, c'est ce que signifie
 * une sanction. Le cas d'une absence avec motif valable (maladie...) est
 * différent et se déclare séparément (statut Absent), en dehors du calcul.
 */
export async function sanctionnerNote(note: Note, motif: string) {
  const { data } = await api.patch<Note>(`/grades/${note.id}/penalize`, { motif })
  await journaliser({
    action: 'GRADE_CANCEL',
    entityType: 'Note',
    entityId: note.id,
    entityLabel: `Sanction · élève ${note.studentId}`,
    before: { status: note.status, value: note.value },
    after: { status: 'PENALIZED', motif },
  })
  return data
}

export async function annulerSanction(note: Note) {
  const { data } = await api.patch<Note>(`/grades/${note.id}/unpenalize`)
  await journaliser({
    action: 'GRADE_UPDATE',
    entityType: 'Note',
    entityId: note.id,
    entityLabel: `Annulation de sanction · élève ${note.studentId}`,
    before: { status: 'PENALIZED' },
    after: { status: 'VALID' },
  })
  return data
}
