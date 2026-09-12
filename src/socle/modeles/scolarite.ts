/**
 * Modeles du lot B · PROPRIETAIRE : Alida
 * Boris et Fabrice : lecture seule. Ajouter un champ = PR sur ce fichier.
 */
import type { EntiteEtablissement } from './communs'

export interface Eleve extends EntiteEtablissement {
  matricule: string
  firstName: string
  lastName: string
  birthDate: string
  birthPlace: string
  gender: 'M' | 'F'
  photoUrl?: string
  phone?: string
  address?: string
  guardianName: string
  guardianPhone: string
  guardianRelationship: 'FATHER' | 'MOTHER' | 'TUTOR' | 'OTHER'
  status: 'ACTIVE' | 'TRANSFERRED' | 'DROPPED' | 'GRADUATED' | 'ARCHIVED'
  createdAt: string
}

export interface Inscription extends EntiteEtablissement {
  studentId: string
  classId: string
  schoolYearId: string
  enrolledAt: string
  status: 'ACTIVE' | 'TRANSFERRED' | 'DROPPED' | 'COMPLETED'
  isRenewal: boolean
}

export interface Enseignant extends EntiteEtablissement {
  userId?: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  subjectIds: string[]
  hireDate?: string
  isActive: boolean
}

/** La CLASSE au sens pedagogique (Terminale D1), a ne pas confondre avec la salle. */
export interface Classe extends EntiteEtablissement {
  schoolYearId: string
  name: string
  level: string
  series?: string
  capacity: number
  roomId?: string
  headTeacherId?: string
  studentCount: number
}

export interface Matiere extends EntiteEtablissement {
  name: string
  code: string
  coefficient: number
  maxGrade: number
  isActive: boolean
}

export interface Salle extends EntiteEtablissement {
  name: string
  capacity: number
  type: 'CLASSROOM' | 'LAB' | 'AMPHI' | 'WORKSHOP'
  isAvailable: boolean
}

export interface Affectation extends EntiteEtablissement {
  schoolYearId: string
  teacherId: string
  subjectId: string
  classId: string
}

export interface CreneauEmploiDuTemps extends EntiteEtablissement {
  schoolYearId: string
  classId: string
  subjectId: string
  teacherId: string
  roomId: string
  /** 1 = lundi ... 6 = samedi */
  dayOfWeek: number
  startTime: string
  endTime: string
}
