/** Menu du lot C · PROPRIETAIRE : Fabrice */
import {
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  Gavel,
  LineChart,
  NotebookPen,
} from 'lucide-react'
import type { GroupeMenu } from './types'

export const menuAcademique: GroupeMenu[] = [
  {
    titre: 'Académique',
    entrees: [
      {
        libelle: 'Évaluations',
        chemin: '/evaluations',
        icone: ClipboardList,
        roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD', 'TEACHER'],
      },
      {
        libelle: 'Saisie des notes',
        chemin: '/notes',
        icone: NotebookPen,
        roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD', 'TEACHER'],
      },
      {
        libelle: 'Planning des évaluations',
        chemin: '/planning-evaluations',
        icone: CalendarRange,
        roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD', 'TEACHER'],
      },
      {
        libelle: 'Bulletins',
        chemin: '/bulletins',
        icone: FileBarChart,
        // TEACHER : uniquement pour ses classes dont il est titulaire, filtré
        // à l'écran et vérifié côté serveur — pas un accès à toutes les
        // classes (voir ListeBulletins.tsx et le contrôle sur
        // GET /report-cards, GET /report-cards/:enrollmentId/:periodId).
        roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD', 'TEACHER'],
      },
    ],
  },
  {
    titre: 'Vie scolaire',
    entrees: [
      {
        libelle: 'Absences',
        chemin: '/absences',
        icone: ClipboardCheck,
        roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD', 'TEACHER'],
      },
      {
        libelle: 'Discipline',
        chemin: '/discipline',
        icone: Gavel,
        roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD'],
      },
    ],
  },
  {
    titre: 'Analyses',
    entrees: [
      {
        libelle: 'Évolution',
        chemin: '/analyses/evolution',
        icone: LineChart,
        roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD'],
      },
      {
        libelle: 'Élèves à risque',
        chemin: '/analyses/eleves-a-risque',
        icone: LineChart,
        roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD'],
      },
    ],
  },
]
