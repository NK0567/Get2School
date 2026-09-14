/**
 * Types transverses · PROPRIETAIRE : Boris
 * Personne ne modifie ce fichier sans PR validée par l'integrateur.
 */

export const ROLES = [
  'PLATFORM_ADMIN',
  'SCHOOL_ADMIN',
  'ADMIN',
  'ACADEMIC_HEAD',
  'SECRETARY',
  'ACCOUNTANT',
  'TEACHER',
] as const

export type Role = (typeof ROLES)[number]

export const LIBELLE_ROLE: Record<Role, string> = {
  PLATFORM_ADMIN: 'Super Administrateur plateforme',
  SCHOOL_ADMIN: "Super Administrateur d'établissement",
  ADMIN: 'Administrateur',
  ACADEMIC_HEAD: 'Responsable pédagogique',
  SECRETARY: 'Secretaire',
  ACCOUNTANT: 'Comptable',
  TEACHER: 'Enseignant',
}

/** Permissions fines, format <MODULE>_<ACTION>. */
export type Permission =
  | 'STUDENT_READ'
  | 'STUDENT_WRITE'
  | 'STUDENT_ARCHIVE'
  | 'GRADE_READ'
  | 'GRADE_WRITE'
  | 'GRADE_UNLOCK'
  | 'PAYMENT_READ'
  | 'PAYMENT_WRITE'
  | 'PAYMENT_CANCEL'
  | 'DOCUMENT_GENERATE'
  | 'USER_MANAGE'
  | 'SETTINGS_MANAGE'
  | 'AUDIT_READ'

/** Reponse paginee, format commun a toutes les listes. */
export interface Page<T> {
  contenu: T[]
  total: number
  page: number
  taille: number
}

/** Toute entite rattachée a un établissement. */
export interface EntiteEtablissement {
  id: string
  establishmentId: string
}
