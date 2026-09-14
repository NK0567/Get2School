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
    status: 'ACTIVE',
    settings: {
      periodType: 'TRIMESTER',
      maxGrade: 20,
      passingGrade: 10,
      penaltyPolicy: 'EXCLUDE_COEFFICIENT',
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
    { id: 'tpl-1', establishmentId: ETB, type: 'BULLETIN', name: 'Bulletin standard', isActive: true },
    { id: 'tpl-2', establishmentId: ETB, type: 'RECEIPT', name: 'Reçu de paiement', isActive: true },
    {
      id: 'tpl-3',
      establishmentId: ETB,
      type: 'CERTIFICATE',
      name: 'Certificat de scolarité',
      isActive: true,
    },
    { id: 'tpl-4', establishmentId: ETB, type: 'LIST', name: 'Liste officielle', isActive: true },
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

  return {
    etablissements: [etablissement],
    utilisateurs,
    anneesScolaires,
    modelesDocuments,
    documentsGeneres: [],
    journalAudit,
    annonces,
    notifications,
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
