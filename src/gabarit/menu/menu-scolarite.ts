/** Menu du lot B · PROPRIETAIRE : Alida */
import {
  BookOpen,
  CalendarClock,
  DoorOpen,
  GraduationCap,
  Link2,
  Receipt,
  School,
  UserCog,
  Wallet,
} from 'lucide-react'
import type { GroupeMenu } from './types'

export const menuScolarite: GroupeMenu[] = [
  {
    titre: 'Scolarité',
    entrees: [
      {
        libelle: 'Élèves',
        chemin: '/eleves',
        icone: GraduationCap,
        roles: ['SCHOOL_ADMIN', 'ADMIN', 'SECRETARY'],
      },
      {
        libelle: 'Inscriptions',
        chemin: '/inscriptions',
        icone: School,
        roles: ['SCHOOL_ADMIN', 'ADMIN', 'SECRETARY'],
      },
      {
        libelle: 'Enseignants',
        chemin: '/enseignants',
        icone: UserCog,
        roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACADEMIC_HEAD'],
      },
    ],
  },
  {
    titre: 'Organisation',
    entrees: [
      {
        libelle: 'Classes',
        chemin: '/classes',
        icone: School,
        roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACADEMIC_HEAD', 'SECRETARY'],
      },
      { libelle: 'Matières', chemin: '/matieres', icone: BookOpen, roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD'] },
      { libelle: 'Salles', chemin: '/salles', icone: DoorOpen, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      {
        libelle: 'Affectations',
        chemin: '/affectations',
        icone: Link2,
        roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACADEMIC_HEAD'],
      },
      {
        libelle: 'Emploi du temps',
        chemin: '/emploi-du-temps',
        icone: CalendarClock,
        roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD', 'TEACHER'],
      },
    ],
  },
  {
    titre: 'Finance',
    entrees: [
      { libelle: 'Frais', chemin: '/finance/frais', icone: Wallet, roles: ['SCHOOL_ADMIN', 'ACCOUNTANT'] },
      {
        libelle: 'Paiements',
        chemin: '/finance/paiements',
        icone: Receipt,
        roles: ['SCHOOL_ADMIN', 'ACCOUNTANT'],
      },
      {
        libelle: 'Listes financières',
        chemin: '/finance/listes',
        icone: Wallet,
        roles: ['SCHOOL_ADMIN', 'ACCOUNTANT'],
      },
    ],
  },
]
