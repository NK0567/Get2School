/**
 * Second établissement de démonstration · PROPRIETAIRE : Boris
 *
 * Un établissement PRIMARY, minimal mais structurellement complet (toutes
 * les collections attendues, même vides), qui existe pour UNE seule raison :
 * prouver que le cloisonnement multi-établissement fonctionne réellement.
 * Sans un second établissement pour de vrai, l'isolation ne serait qu'une
 * affirmation dans un commentaire, jamais vérifiée.
 *
 * Volontairement séparé des données du Lycée Bilingue de Bafoussam
 * (donnees-administration.ts, donnees-scolarite.ts, donnees-academique.ts,
 * qui restent inchangées) : les faire cohabiter dans les mêmes fichiers
 * aurait forcé à les paramétrer en profondeur, avec le risque de régression
 * que ça comporte sur des données déjà largement testées.
 */
import type {
  AnneeScolaire,
  Annonce,
  DocumentGenere,
  EntreeAudit,
  Etablissement,
  ModeleDocument,
  Notification,
  Utilisateur,
} from '../modeles/administration'
import type {
  Affectation,
  Classe,
  CreneauEmploiDuTemps,
  Eleve,
  Enseignant,
  Inscription,
  Matiere,
  Salle,
} from '../modeles/scolarite'
import type { Exoneration, Frais, Paiement, Recu } from '../modeles/finances'
import type {
  EvenementDisciplinaire,
  EvenementPlanifie,
  Evaluation,
  Note,
  Presence,
} from '../modeles/academique'

export const ETB2 = 'etb-2'
const ANNEE2 = 'an2-2026'

export function etablissementsSecondaireGlobaux() {
  const etablissement: Etablissement = {
    id: ETB2,
    code: 'EPC',
    name: 'École Primaire La Colombe',
    acronym: 'EPC',
    slogan: 'Apprendre, grandir, réussir',
    address: 'BP 88, Douala',
    phone: '+237 677 00 11 22',
    email: 'contact@epc-douala.cm',
    institutionalId: 'G2S-CM-2026-P2X9L',
    category: 'PRIMARY',
    theme: 'VERT',
    abonnement: {
      statut: 'ACTIF',
      essaiDebute: '2026-09-01',
      planId: 'PRIMARY',
      abonneLe: '2026-09-10',
      expireLe: '2027-06-30',
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
    {
      id: 'usr2-1',
      establishmentId: ETB2,
      firstName: 'Rosine',
      lastName: 'Mballa',
      email: 'direction@epc-douala.cm',
      role: 'SCHOOL_ADMIN',
      permissions: [],
      isActive: true,
      lastLoginAt: undefined,
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'usr2-2',
      establishmentId: ETB2,
      firstName: 'Patrice',
      lastName: 'Ekwalla',
      email: 'p.ekwalla@epc-douala.cm',
      role: 'TEACHER',
      permissions: [],
      isActive: true,
      lastLoginAt: undefined,
      createdAt: '2026-09-01T08:00:00Z',
    },
  ]

  return { etablissements: [etablissement], utilisateurs }
}

export function donneesSecondaireParEtablissement() {
  const anneesScolaires: AnneeScolaire[] = [
    {
      id: ANNEE2,
      establishmentId: ETB2,
      label: '2026-2027',
      startDate: '2026-09-01',
      endDate: '2027-06-30',
      status: 'OPEN',
      periods: [
        {
          id: `${ANNEE2}-p1`,
          schoolYearId: ANNEE2,
          label: 'Trimestre 1',
          order: 1,
          startDate: '2026-09-01',
          endDate: '2026-12-15',
          isLocked: false,
        },
        {
          id: `${ANNEE2}-p2`,
          schoolYearId: ANNEE2,
          label: 'Trimestre 2',
          order: 2,
          startDate: '2027-01-05',
          endDate: '2027-03-30',
          isLocked: false,
        },
        {
          id: `${ANNEE2}-p3`,
          schoolYearId: ANNEE2,
          label: 'Trimestre 3',
          order: 3,
          startDate: '2027-04-10',
          endDate: '2027-06-30',
          isLocked: false,
        },
      ],
    },
  ]

  const salles: Salle[] = [
    {
      id: 'sal2-1',
      establishmentId: ETB2,
      name: 'Salle CM2',
      capacity: 35,
      type: 'CLASSROOM',
      isAvailable: true,
    },
  ]

  const matieres: Matiere[] = [
    {
      id: 'mat2-1',
      establishmentId: ETB2,
      name: 'Français',
      code: 'FR',
      coefficient: 4,
      maxGrade: 20,
      isActive: true,
    },
    {
      id: 'mat2-2',
      establishmentId: ETB2,
      name: 'Mathématiques',
      code: 'MATH',
      coefficient: 4,
      maxGrade: 20,
      isActive: true,
    },
  ]

  const classes: Classe[] = [
    {
      id: 'cls2-1',
      establishmentId: ETB2,
      schoolYearId: ANNEE2,
      name: 'CM2',
      level: 'CM2',
      capacity: 40,
      roomId: 'sal2-1',
      studentCount: 1,
    },
  ]

  const enseignants: Enseignant[] = [
    {
      id: 'ens2-1',
      establishmentId: ETB2,
      userId: 'usr2-2',
      firstName: 'Patrice',
      lastName: 'Ekwalla',
      phone: '+237 677 22 33 44',
      subjectIds: ['mat2-1', 'mat2-2'],
      hireDate: '2020-09-01',
      isActive: true,
    },
  ]

  const eleves: Eleve[] = [
    {
      id: 'elv2-1',
      establishmentId: ETB2,
      matricule: 'EPC-26-0001',
      firstName: 'Noa',
      lastName: 'Mvondo',
      birthDate: '2015-03-10',
      birthPlace: 'Douala',
      gender: 'M',
      guardianName: 'Chantal Mvondo',
      guardianPhone: '+237 699 11 22 33',
      guardianRelationship: 'MOTHER',
      status: 'ACTIVE',
      createdAt: '2026-09-01T09:00:00Z',
    },
  ]

  const inscriptions: Inscription[] = [
    {
      id: 'ins2-1',
      establishmentId: ETB2,
      studentId: 'elv2-1',
      classId: 'cls2-1',
      schoolYearId: ANNEE2,
      enrolledAt: '2026-09-01',
      status: 'ACTIVE',
      isRenewal: false,
    },
  ]

  const affectations: Affectation[] = [
    {
      id: 'aff2-1',
      establishmentId: ETB2,
      schoolYearId: ANNEE2,
      teacherId: 'ens2-1',
      subjectId: 'mat2-1',
      classId: 'cls2-1',
    },
    {
      id: 'aff2-2',
      establishmentId: ETB2,
      schoolYearId: ANNEE2,
      teacherId: 'ens2-1',
      subjectId: 'mat2-2',
      classId: 'cls2-1',
    },
  ]

  const modelesDocuments: ModeleDocument[] = [
    { id: 'tpl2-1', establishmentId: ETB2, type: 'BULLETIN', name: 'Bulletin standard', isActive: true },
    {
      id: 'tpl2-2',
      establishmentId: ETB2,
      type: 'CERTIFICAT_SCOLARITE',
      name: 'Certificat de scolarité',
      isActive: true,
    },
    {
      id: 'tpl2-3',
      establishmentId: ETB2,
      type: 'CHRONOGRAMME',
      name: "Chronogramme de l'année",
      isActive: true,
    },
    {
      id: 'tpl2-4',
      establishmentId: ETB2,
      type: 'LISTE_PERSONNEL',
      name: 'Liste du personnel',
      isActive: true,
    },
    {
      id: 'tpl2-5',
      establishmentId: ETB2,
      type: 'EMPLOI_DU_TEMPS_CLASSE',
      name: "Emploi du temps d'une classe",
      isActive: true,
    },
  ]

  return {
    anneesScolaires,
    modelesDocuments,
    documentsGeneres: [] as DocumentGenere[],
    journalAudit: [] as EntreeAudit[],
    annonces: [] as Annonce[],
    notifications: [] as Notification[],
    matriceRoles: [
      {
        ADMIN: ['STUDENT_READ', 'STUDENT_WRITE', 'DOCUMENT_GENERATE', 'USER_MANAGE'],
        ACADEMIC_HEAD: ['STUDENT_READ', 'GRADE_READ', 'GRADE_WRITE', 'DOCUMENT_GENERATE'],
        SECRETARY: ['STUDENT_READ', 'STUDENT_WRITE', 'DOCUMENT_GENERATE'],
        ACCOUNTANT: ['STUDENT_READ', 'PAYMENT_READ', 'PAYMENT_WRITE', 'DOCUMENT_GENERATE'],
        TEACHER: ['STUDENT_READ', 'GRADE_READ', 'GRADE_WRITE'],
      },
    ],
    eleves,
    inscriptions,
    enseignants,
    classes,
    matieres,
    salles,
    affectations,
    emploiDuTemps: [] as CreneauEmploiDuTemps[],
    frais: [] as Frais[],
    exonerations: [] as Exoneration[],
    paiements: [] as Paiement[],
    recus: [] as Recu[],
    evaluations: [] as Evaluation[],
    notes: [] as Note[],
    presences: [] as Presence[],
    evenementsDisciplinaires: [] as EvenementDisciplinaire[],
    evenementsPlanifies: [] as EvenementPlanifie[],
  }
}
