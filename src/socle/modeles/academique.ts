/**
 * Modèles du lot C · PROPRIETAIRE : Fabrice
 * Boris et Alida : lecture seule.
 */
import type { EntiteEtablissement } from './communs'

export interface Evaluation extends EntiteEtablissement {
  schoolYearId: string
  periodId: string
  classId: string
  subjectId: string
  teacherId: string
  title: string
  type: 'QUIZ' | 'HOMEWORK' | 'COMPOSITION' | 'EXAM' | 'TEST' | 'PRACTICAL'
  date: string
  maxGrade: number
  coefficient: number
  status: 'DRAFT' | 'PUBLISHED' | 'LOCKED'
}

export interface Note extends EntiteEtablissement {
  evaluationId: string
  studentId: string
  enrollmentId: string
  value: number | null
  /** PENALIZED = note sanctionnée avec motif obligatoire, jamais supprimée. */
  status: 'VALID' | 'PENALIZED' | 'ABSENT'
  penaltyReason?: string
  comment?: string
  enteredBy: string
  enteredAt: string
  updatedBy?: string
  updatedAt?: string
}

export interface Presence extends EntiteEtablissement {
  studentId: string
  enrollmentId: string
  date: string
  type: 'ABSENCE' | 'LATE'
  slotId?: string
  durationMinutes?: number
  isJustified: boolean
  reason?: string
  recordedBy: string
  recordedAt: string
}

export interface EvenementDisciplinaire extends EntiteEtablissement {
  studentId: string
  enrollmentId: string
  date: string
  type: 'OBSERVATION' | 'INCIDENT' | 'WARNING' | 'REPRIMAND' | 'SANCTION' | 'SUSPENSION'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
  decision?: string
  reportedBy: string
  decidedBy?: string
  createdAt: string
}

export interface EvenementPlanifie extends EntiteEtablissement {
  schoolYearId: string
  periodId?: string
  kind: 'EVALUATION' | 'MEETING' | 'ACTIVITY' | 'DEADLINE' | 'HOLIDAY'
  title: string
  classId?: string
  subjectId?: string
  startDate: string
  endDate?: string
  description?: string
}

/* ── Resultats de calcul · jamais stockes en base ─────────── */

export interface MoyenneMatiere {
  subjectId: string
  subjectName: string
  coefficient: number
  average: number | null
  classAverage: number | null
  rank: number | null
  appreciation: string
}

export interface MoyenneGenerale {
  enrollmentId: string
  periodId: string
  average: number | null
  rank: number | null
  total: number
  appreciation: string
  passed: boolean
}

export interface ScoreRisque {
  enrollmentId: string
  score: number
  level: 'LOW' | 'MEDIUM' | 'HIGH'
  factors: { average: number; trend: number; absence: number; discipline: number }
}

/** Contrat figé entre le lot C (contenu) et le lot A (document imprime). */
export interface DonneesBulletin {
  student: { matricule: string; fullName: string; birthDate: string }
  classroom: { name: string; level: string; series?: string; headcount: number }
  period: { label: string; schoolYear: string }
  subjects: MoyenneMatiere[]
  general: MoyenneGenerale
  attendance: { absences: number; justified: number; lateCount: number }
  discipline: { events: number; highestSeverity: string | null }
  councilDecision?: string
}
