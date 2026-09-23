/**
 * Jeu de demonstration du lot A · PROPRIETAIRE : Boris
 */
import type {
  AnneeScolaire,
  Etablissement,
  Utilisateur,
  EntreeAudit,
  Annonce,
  Notification,
  ModeleDocument,
} from '../modeles/administration'

const ETB = 'etb-1'

export function donneesAdministration() {
  const etablissement: Etablissement = {
    id: ETB,
    code: 'LBK',
    name: 'Lycée Bilingue de Bafoussam',
    acronym: 'LBB',
    slogan: 'Travail, Rigueur, Réussite',
    address: 'BP 214, Bafoussam',
    phone: '+237 699 00 00 00',
    email: 'contact@lyceebafoussam.cm',
    institutionalId: 'G2S-CM-2026-8F4K2',
    category: 'SECONDARY',
    theme: 'BLEU',
    abonnement: {
      statut: 'ACTIF',
      essaiDebute: '2026-09-01',
      planId: 'SECONDARY',
      abonneLe: '2026-09-15',
      expireLe: '2027-07-15',
    },
    status: 'ACTIVE',
    settings: {
      periodType: 'TRIMESTER',
      maxGrade: 20,
      passingGrade: 10,
      currency: 'FCFA',
      riskWeights: { average: 40, trend: 20, absence: 25, discipline: 15 },
    },
  }

  const utilisateurs: Utilisateur[] = [
    u('usr-1', 'Boris', 'Kalefack', 'direction@lyceebafoussam.cm', 'SCHOOL_ADMIN'),
    u('usr-2', 'Alida', 'Ngassa', 'secretariat@lyceebafoussam.cm', 'SECRETARY'),
    u('usr-3', 'Fabrice', 'Tchoumi', 'pedagogie@lyceebafoussam.cm', 'ACADEMIC_HEAD'),
    u('usr-4', 'Marthe', 'Ndongo', 'comptabilite@lyceebafoussam.cm', 'ACCOUNTANT'),
    u('usr-5', 'Serge', 'Mbala', 'smbala@lyceebafoussam.cm', 'TEACHER'),
    u('usr-6', 'Claire', 'Fotso', 'cfotso@lyceebafoussam.cm', 'TEACHER'),
    u('usr-7', 'Junior', 'Nana', 'jnana@lyceebafoussam.cm', 'ADMIN', false),
  ]

  const anneesScolaires: AnneeScolaire[] = [
    {
      id: 'an-2025',
      establishmentId: ETB,
      label: '2025-2026',
      startDate: '2025-09-01',
      endDate: '2026-07-15',
      status: 'CLOSED',
      periods: trimestres('an-2025', 2025, true),
    },
    {
      id: 'an-2026',
      establishmentId: ETB,
      label: '2026-2027',
      startDate: '2026-09-01',
      endDate: '2027-07-15',
      status: 'OPEN',
      periods: trimestres('an-2026', 2026, false),
    },
  ]

  const modelesDocuments: ModeleDocument[] = [
    tpl('tpl-1', 'BULLETIN', 'Bulletin standard', true),
    tpl('tpl-2', 'BULLETIN', 'Bulletin détaillé avec moyenne de classe', false),
    tpl('tpl-3', 'CERTIFICAT_SCOLARITE', 'Certificat de scolarité', true),
    tpl('tpl-4', 'CARTE_SCOLAIRE', 'Carte scolaire', true),
    tpl('tpl-5', 'FICHE_ELEVE', 'Fiche individuelle', true),
    tpl('tpl-6', 'LISTE_CLASSE', 'Liste de classe', true),
    tpl('tpl-7', 'RELEVE_NOTES', 'Relevé de notes', true),
    tpl('tpl-8', 'RECU_PAIEMENT', 'Reçu de paiement', true),
    tpl('tpl-9', 'LISTE_SOLVABILITE', 'Liste de solvabilité', true),
    tpl('tpl-10', 'ETAT_EFFECTIFS', 'État des effectifs', true),
    tpl('tpl-11', 'CHRONOGRAMME', "Chronogramme de l'année", true),
    tpl('tpl-12', 'LISTE_PERSONNEL', 'Liste du personnel', true),
    tpl('tpl-13', 'EMPLOI_DU_TEMPS_CLASSE', "Emploi du temps d'une classe", true),
  ]

  const journalAudit: EntreeAudit[] = [
    {
      id: 'aud-1',
      establishmentId: ETB,
      userId: 'usr-1',
      userLabel: 'Boris Kalefack',
      action: 'YEAR_OPEN',
      entityType: 'AnneeScolaire',
      entityId: 'an-2026',
      entityLabel: '2026-2027',
      before: { status: 'DRAFT' },
      after: { status: 'OPEN' },
      createdAt: '2026-09-01T08:12:00Z',
      ipAddress: '10.0.0.4',
    },
  ]

  const annonces: Annonce[] = []
  const notifications: Notification[] = []

  // Socle de permissions par rôle. Le Super Administrateur n'y figure pas :
  // il détient toutes les permissions en permanence.
  const matriceRoles = [
    {
      ADMIN: ['STUDENT_READ', 'STUDENT_WRITE', 'DOCUMENT_GENERATE', 'USER_MANAGE'],
      ACADEMIC_HEAD: ['STUDENT_READ', 'GRADE_READ', 'GRADE_WRITE', 'DOCUMENT_GENERATE'],
      SECRETARY: ['STUDENT_READ', 'STUDENT_WRITE', 'DOCUMENT_GENERATE'],
      ACCOUNTANT: ['STUDENT_READ', 'PAYMENT_READ', 'PAYMENT_WRITE', 'DOCUMENT_GENERATE'],
      TEACHER: ['STUDENT_READ', 'GRADE_READ', 'GRADE_WRITE'],
    },
  ]

  return {
    etablissements: [etablissement],
    utilisateurs,
    anneesScolaires,
    modelesDocuments,
    documentsGeneres: [],
    journalAudit,
    annonces,
    notifications,
    matriceRoles,
  }
}

function u(
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  role: Utilisateur['role'],
  isActive = true,
): Utilisateur {
  return {
    id,
    establishmentId: ETB,
    firstName,
    lastName,
    email,
    role,
    permissions: [],
    isActive,
    lastLoginAt: isActive ? '2026-09-10T07:30:00Z' : undefined,
    createdAt: '2026-08-20T09:00:00Z',
  }
}

function trimestres(anneeId: string, an: number, verrouilles: boolean) {
  return [
    {
      id: `${anneeId}-p1`,
      schoolYearId: anneeId,
      label: 'Trimestre 1',
      order: 1,
      startDate: `${an}-09-01`,
      endDate: `${an}-12-15`,
      isLocked: verrouilles,
    },
    {
      id: `${anneeId}-p2`,
      schoolYearId: anneeId,
      label: 'Trimestre 2',
      order: 2,
      startDate: `${an + 1}-01-05`,
      endDate: `${an + 1}-03-30`,
      isLocked: verrouilles,
    },
    {
      id: `${anneeId}-p3`,
      schoolYearId: anneeId,
      label: 'Trimestre 3',
      order: 3,
      startDate: `${an + 1}-04-06`,
      endDate: `${an + 1}-07-10`,
      isLocked: verrouilles,
    },
  ]
}

function tpl(id: string, type: string, name: string, isActive: boolean): ModeleDocument {
  return { id, establishmentId: ETB, type, name, isActive }
}
