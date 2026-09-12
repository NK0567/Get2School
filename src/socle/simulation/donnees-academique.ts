/**
 * Jeu de demonstration du lot C · PROPRIETAIRE : Fabrice
 *
 * Objectif : trois evaluations notees par matiere et par periode, des absences
 * et des incidents sur une trentaine d'eleves. Le squelette est a completer.
 */
import type { Evaluation, Note } from '../modeles/academique'

const ETB = 'etb-1'
const ANNEE = 'an-2026'

export function donneesAcademique() {
  const evaluations: Evaluation[] = [
    {
      id: 'eva-1',
      establishmentId: ETB,
      schoolYearId: ANNEE,
      periodId: 'an-2026-p1',
      classId: 'cls-1',
      subjectId: 'mat-1',
      teacherId: 'ens-1',
      title: 'Interrogation 1 · Suites numeriques',
      type: 'QUIZ',
      date: '2026-10-05',
      maxGrade: 20,
      coefficient: 1,
      status: 'PUBLISHED',
    },
  ]

  const notes: Note[] = [
    n('not-1', 'eva-1', 'elv-1', 'ins-1', 14.5),
    n('not-2', 'eva-1', 'elv-2', 'ins-2', 11),
  ]

  return { evaluations, notes, presences: [], evenementsDisciplinaires: [], evenementsPlanifies: [] }
}

function n(id: string, evaluationId: string, studentId: string, enrollmentId: string, value: number): Note {
  return {
    id,
    establishmentId: ETB,
    evaluationId,
    studentId,
    enrollmentId,
    value,
    status: 'VALID',
    enteredBy: 'usr-5',
    enteredAt: '2026-10-06T09:00:00Z',
  }
}
