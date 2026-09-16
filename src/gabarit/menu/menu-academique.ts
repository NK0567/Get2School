/** Menu du lot C · PROPRIETAIRE : Fabrice */
import { ClipboardCheck, ClipboardList, FileBarChart, Gavel, LineChart, NotebookPen } from 'lucide-react'
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
        libelle: 'Bulletins',
        chemin: '/bulletins',
        icone: FileBarChart,
        roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD'],
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
