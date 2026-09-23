/**
 * Jeu de demonstration du lot B · PROPRIETAIRE : Alida
 *
 * Objectif : 240 élèves, 8 classes sur 4 niveaux, 22 enseignants, 12 matières,
 * 10 salles, des frais a trois tranches et des paiements produisant les quatre
 * statuts financiers. Le squelette ci-dessous est a completer.
 */
import type { Classe, Eleve, Enseignant, Inscription, Matiere, Salle } from '../modeles/scolarite'
import type { Exoneration, Frais, Paiement, Recu } from '../modeles/finances'

const ETB = 'etb-1'
const ANNEE = 'an-2026'

export function donneesScolarite() {
  const matieres: Matiere[] = [
    m('mat-1', 'Mathématiques', 'MATH', 5),
    m('mat-2', 'Physique-Chimie', 'PC', 4),
    m('mat-3', 'Sciences de la Vie et de la Terre', 'SVT', 3),
    m('mat-4', 'Français', 'FR', 3),
    m('mat-5', 'Anglais', 'ANG', 2),
    m('mat-6', 'Histoire-Géographie', 'HG', 2),
    m('mat-7', 'Philosophie', 'PHILO', 2),
    m('mat-8', 'Éducation Physique et Sportive', 'EPS', 1),
  ]

  const salles: Salle[] = [
    {
      id: 'sal-1',
      establishmentId: ETB,
      name: 'Salle A1',
      capacity: 60,
      type: 'CLASSROOM',
      isAvailable: true,
    },
    {
      id: 'sal-2',
      establishmentId: ETB,
      name: 'Salle A2',
      capacity: 55,
      type: 'CLASSROOM',
      isAvailable: true,
    },
    { id: 'sal-3', establishmentId: ETB, name: 'Laboratoire', capacity: 30, type: 'LAB', isAvailable: true },
  ]

  const classes: Classe[] = [
    c('cls-1', 'Terminale D1', 'Terminale', 'D', 55, 'sal-1'),
    c('cls-2', 'Terminale C1', 'Terminale', 'C', 42, 'sal-2'),
    c('cls-3', 'Première D1', 'Premiere', 'D', 60, 'sal-1'),
    c('cls-4', 'Seconde A', 'Seconde', 'A', 58, 'sal-2'),
  ]

  const enseignants: Enseignant[] = [
    {
      id: 'ens-1',
      establishmentId: ETB,
      userId: 'usr-5',
      firstName: 'Serge',
      lastName: 'Mbala',
      phone: '+237 677 11 22 33',
      subjectIds: ['mat-1'],
      isActive: true,
    },
    {
      id: 'ens-2',
      establishmentId: ETB,
      userId: 'usr-6',
      firstName: 'Claire',
      lastName: 'Fotso',
      phone: '+237 677 44 55 66',
      subjectIds: ['mat-4', 'mat-5'],
      isActive: true,
    },
  ]

  const eleves: Eleve[] = [
    e('elv-1', 'LBK-26-0001', 'Ariane', 'Kamga', 'F', 'Ariane Kamga senior'),
    e('elv-2', 'LBK-26-0002', 'Blaise', 'Tchatchoua', 'M', 'Berthe Tchatchoua'),
    e('elv-3', 'LBK-26-0003', 'Carine', 'Njoya', 'F', 'Paul Njoya'),
    e('elv-4', 'LBK-26-0004', 'Donald', 'Wafo', 'M', 'Solange Wafo'),
  ]

  const inscriptions: Inscription[] = eleves.map((el, i) => ({
    id: `ins-${i + 1}`,
    establishmentId: ETB,
    studentId: el.id,
    classId: i < 2 ? 'cls-1' : 'cls-2',
    schoolYearId: ANNEE,
    enrolledAt: '2026-09-02',
    status: 'ACTIVE',
    isRenewal: i % 2 === 0,
  }))

  return {
    eleves,
    inscriptions,
    enseignants,
    classes,
    matieres,
    salles,
    // Affectations minimales pour que le lot C (évaluations, notes) ait des
    // données à afficher : Serge Mbala enseigne les mathématiques en
    // Terminale D1 et C1, Claire Fotso le français en Terminale D1.
    affectations: [
      {
        id: 'aff-1',
        establishmentId: ETB,
        schoolYearId: ANNEE,
        teacherId: 'ens-1',
        subjectId: 'mat-1',
        classId: 'cls-1',
      },
      {
        id: 'aff-2',
        establishmentId: ETB,
        schoolYearId: ANNEE,
        teacherId: 'ens-1',
        subjectId: 'mat-1',
        classId: 'cls-2',
      },
      {
        id: 'aff-3',
        establishmentId: ETB,
        schoolYearId: ANNEE,
        teacherId: 'ens-2',
        subjectId: 'mat-4',
        classId: 'cls-1',
      },
    ],
    emploiDuTemps: [],
    // Un frais à trois tranches, portée établissement, et des paiements qui
    // produisent chacun des quatre statuts financiers : elv-1 soldé,
    // elv-2 partiel, elv-3 impayé, elv-4 exonéré. Sert de démonstration au
    // module Finance et de cas réel pour ses tests.
    frais: [
      {
        id: 'fr-1',
        establishmentId: ETB,
        schoolYearId: ANNEE,
        label: 'Frais de scolarité annuel',
        scope: 'ALL',
        amount: 150000,
        isMandatory: true,
        installments: [
          {
            id: 'tr-1',
            feeItemId: 'fr-1',
            label: '1re tranche',
            amount: 50000,
            dueDate: `${ANNEE.split('-')[1]}-09-30`,
          },
          {
            id: 'tr-2',
            feeItemId: 'fr-1',
            label: '2e tranche',
            amount: 50000,
            dueDate: `${ANNEE.split('-')[1]}-12-15`,
          },
          { id: 'tr-3', feeItemId: 'fr-1', label: '3e tranche', amount: 50000, dueDate: '2027-03-15' },
        ],
      } satisfies Frais,
    ],
    exonerations: [
      {
        id: 'exo-1',
        establishmentId: ETB,
        studentId: 'elv-4',
        schoolYearId: ANNEE,
        reason: 'Bourse de mérite académique',
        grantedBy: 'usr-1',
        grantedAt: `${ANNEE}-09-05`,
      } satisfies Exoneration,
    ],
    paiements: [
      pay('pay-1', 'elv-1', 'ins-1', 150000, 'CASH', `${ANNEE}-09-10`),
      pay('pay-2', 'elv-2', 'ins-2', 60000, 'MOBILE_MONEY', `${ANNEE}-09-12`),
    ],
    recus: [
      {
        id: 'rec-1',
        establishmentId: ETB,
        number: 'LBK-REC-00001',
        paymentId: 'pay-1',
        studentId: 'elv-1',
        amount: 150000,
        issuedAt: `${ANNEE}-09-10`,
        issuedBy: 'usr-4',
        status: 'VALID',
      } satisfies Recu,
      {
        id: 'rec-2',
        establishmentId: ETB,
        number: 'LBK-REC-00002',
        paymentId: 'pay-2',
        studentId: 'elv-2',
        amount: 60000,
        issuedAt: `${ANNEE}-09-12`,
        issuedBy: 'usr-4',
        status: 'VALID',
      } satisfies Recu,
    ],
  }
}

function pay(
  id: string,
  studentId: string,
  enrollmentId: string,
  amount: number,
  method: Paiement['method'],
  paidAt: string,
): Paiement {
  return {
    id,
    establishmentId: ETB,
    reference: `LBK-PAY-${id.split('-')[1].padStart(5, '0')}`,
    studentId,
    enrollmentId,
    feeItemId: 'fr-1',
    amount,
    method,
    paidAt,
    recordedBy: 'usr-4',
    status: 'VALID',
  }
}

function m(id: string, name: string, code: string, coefficient: number): Matiere {
  return { id, establishmentId: ETB, name, code, coefficient, maxGrade: 20, isActive: true }
}

function c(
  id: string,
  name: string,
  level: string,
  series: string,
  studentCount: number,
  roomId: string,
): Classe {
  return {
    id,
    establishmentId: ETB,
    schoolYearId: ANNEE,
    name,
    level,
    series,
    capacity: 60,
    roomId,
    studentCount,
  }
}

function e(
  id: string,
  matricule: string,
  firstName: string,
  lastName: string,
  gender: 'M' | 'F',
  guardianName: string,
): Eleve {
  return {
    id,
    establishmentId: ETB,
    matricule,
    firstName,
    lastName,
    birthDate: '2008-04-12',
    birthPlace: 'Bafoussam',
    gender,
    guardianName,
    guardianPhone: '+237 699 88 77 66',
    guardianRelationship: 'FATHER',
    status: 'ACTIVE',
    createdAt: '2026-09-02T10:00:00Z',
  }
}
