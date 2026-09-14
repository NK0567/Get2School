/**
 * Modèles du lot A · PROPRIETAIRE : Boris
 * Alida et Fabrice : lecture seule.
 */
import type { EntiteEtablissement, Permission, Role } from './communs'

export interface ParametresEtablissement {
  periodType: 'TRIMESTER' | 'SEMESTER'
  maxGrade: number
  passingGrade: number
  /** Effet d'une note sanctionnée sur le calcul de la moyenne. */
  penaltyPolicy: 'EXCLUDE_COEFFICIENT' | 'COUNT_AS_ZERO'
  currency: string
  riskWeights: { average: number; trend: number; absence: number; discipline: number }
}

export interface Etablissement {
  id: string
  code: string
  name: string
  acronym: string
  slogan?: string
  logoUrl?: string
  address: string
  phone: string
  email: string
  website?: string
  institutionalId: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  settings: ParametresEtablissement
}

export interface Utilisateur extends EntiteEtablissement {
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: Role
  permissions: Permission[]
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface Periode {
  id: string
  schoolYearId: string
  label: string
  order: number
  startDate: string
  endDate: string
  isLocked: boolean
}

export interface AnneeScolaire extends EntiteEtablissement {
  label: string
  startDate: string
  endDate: string
  status: 'DRAFT' | 'OPEN' | 'CLOSED'
  periods: Periode[]
}

export type ActionAudit =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_ROLE_CHANGE'
  | 'USER_ACTIVATE'
  | 'USER_DEACTIVATE'
  | 'PERMISSION_CHANGE'
  | 'YEAR_OPEN'
  | 'YEAR_CLOSE'
  | 'PERIOD_LOCK'
  | 'PERIOD_UNLOCK'
  | 'GRADE_CREATE'
  | 'GRADE_UPDATE'
  | 'GRADE_CANCEL'
  | 'PAYMENT_CREATE'
  | 'PAYMENT_CANCEL'
  | 'FEE_UPDATE'
  | 'EXEMPTION_GRANT'
  | 'DISCIPLINE_CREATE'
  | 'DISCIPLINE_DECISION'
  | 'DOCUMENT_GENERATE'
  | 'ANNOUNCEMENT_PUBLISH'
  | 'STUDENT_ARCHIVE'
  | 'ENROLLMENT_TRANSFER'
  | 'ACCESS_DENIED'

export interface EntreeAudit extends EntiteEtablissement {
  userId: string
  userLabel: string
  action: ActionAudit
  entityType: string
  entityId: string
  entityLabel: string
  before: unknown | null
  after: unknown | null
  createdAt: string
  ipAddress: string
}

export interface ModeleDocument extends EntiteEtablissement {
  type: string
  name: string
  isActive: boolean
}

export interface DocumentGenere extends EntiteEtablissement {
  reference: string
  type: string
  templateId: string
  targetType: 'STUDENT' | 'CLASS' | 'LEVEL' | 'ESTABLISHMENT'
  targetId: string
  schoolYearId: string
  periodId?: string
  generatedBy: string
  generatedAt: string
  status: 'PENDING' | 'GENERATED' | 'FAILED' | 'CANCELLED'
}

export interface Annonce extends EntiteEtablissement {
  title: string
  body: string
  authorId: string
  audienceType: 'ALL_TEACHERS' | 'ALL_STAFF' | 'CLASS' | 'LEVEL' | 'CUSTOM_GROUP'
  audienceRefs: string[]
  priority: 'NORMAL' | 'HIGH' | 'URGENT'
  publishedAt?: string
  status: 'DRAFT' | 'PUBLISHED'
}

export interface Notification extends EntiteEtablissement {
  recipientUserId: string
  type: string
  title: string
  body: string
  linkRoute?: string
  isRead: boolean
  createdAt: string
}
