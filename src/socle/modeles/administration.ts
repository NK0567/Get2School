/**
 * Modèles du lot A · PROPRIETAIRE : Boris
 * Alida et Fabrice : lecture seule.
 */
import type { EntiteEtablissement, Permission, Role } from './communs'

export interface ParametresEtablissement {
  periodType: 'TRIMESTER' | 'SEMESTER'
  maxGrade: number
  passingGrade: number
  currency: string
  riskWeights: { average: number; trend: number; absence: number; discipline: number }
}

export type RaisonFinEssai = 'PERIODE_VERROUILLEE' | 'BULLETINS_COMPLETS' | 'QUATRE_MOIS_ECOULES'

/**
 * Essai gratuit puis abonnement, RG explicite : un trimestre gratuit à
 * compter de la création de l'établissement, qui se termine au premier de
 * trois déclencheurs (voir modules/abonnement/calculs.ts pour le détail).
 * L'abonnement, une fois pris, se termine avec l'année scolaire — jamais
 * reconduit tacitement au-delà.
 */
export interface Abonnement {
  statut: 'ESSAI' | 'ACTIF' | 'EXPIRE'
  essaiDebute: string
  essaiTermine?: string
  essaiRaison?: RaisonFinEssai
  planId?: 'PRIMARY' | 'SECONDARY'
  abonneLe?: string
  expireLe?: string
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
  /**
   * Catégorie de l'établissement. Détermine notamment le tarif d'abonnement
   * (le primaire coûte moins cher que le secondaire) et pourra plus tard
   * adapter certains écrans. Le supérieur n'est pas pris en charge pour
   * l'instant — décision explicite, pas un oubli.
   */
  category: 'PRIMARY' | 'SECONDARY'
  /**
   * Couleur d'accent choisie parmi un jeu prédéfini à l'inscription, reprise
   * sur les documents générés (GabaritDocument). Ce n'est pas un système de
   * thématisation complet de l'application — celui-ci resterait un chantier
   * à part entière — mais une personnalisation minimale et honnête.
   */
  theme: 'BLEU' | 'VERT' | 'BORDEAUX' | 'VIOLET'
  abonnement: Abonnement
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
  /**
   * Vrai pour un compte créé avec un mot de passe par défaut (à la
   * constitution de l'équipe par le responsable). Bloque l'accès à tout
   * écran autre que le changement de mot de passe tant qu'il n'est pas
   * passé à faux — RG explicite : un mot de passe par défaut n'est jamais
   * une autorisation d'usage normal du compte.
   */
  mustChangePassword?: boolean
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
  | 'ANNOUNCEMENT_WITHDRAW'
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

/**
 * Une session active par connexion réussie. Contrairement au reste du
 * projet, ce n'est pas une entité scolaire : elle vit à côté des comptes
 * (voir base.ts), rattachée à un utilisateur, pas à un établissement au
 * sens métier — mais reste partitionnée comme tout le reste, un compte
 * d'un établissement ne devant jamais voir les sessions d'un autre.
 */
export interface SessionActive {
  id: string
  userId: string
  appareil: string
  adresseIp: string
  ouvreLe: string
  derniereActivite: string
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
  /** Identifiant réel de la cible (élève, classe...), jamais un texte mis en forme. */
  targetId: string
  /** Libellé lisible de la cible, résolu par le serveur à la lecture — jamais stocké. */
  targetLabel?: string
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
