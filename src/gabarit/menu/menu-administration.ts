/** Menu du lot A · PROPRIETAIRE : Boris */
import {
  Bell,
  Building2,
  CalendarRange,
  FileText,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Search,
  Users,
} from 'lucide-react'
import type { GroupeMenu } from './types'

export const menuAdministration: GroupeMenu[] = [
  {
    titre: 'Pilotage',
    entrees: [
      {
        libelle: 'Tableau de bord',
        chemin: '/tableau-de-bord',
        icone: LayoutDashboard,
        roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACADEMIC_HEAD', 'SECRETARY', 'ACCOUNTANT', 'TEACHER'],
      },
      {
        libelle: 'Recherche globale',
        chemin: '/recherche',
        icone: Search,
        roles: ['SCHOOL_ADMIN', 'ADMIN', 'SECRETARY'],
      },
    ],
  },
  {
    titre: 'Administration',
    entrees: [
      { libelle: 'Utilisateurs', chemin: '/utilisateurs', icone: Users, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      {
        libelle: 'Etablissement',
        chemin: '/etablissement/parametres',
        icone: Building2,
        roles: ['SCHOOL_ADMIN'],
      },
      {
        libelle: 'Annees scolaires',
        chemin: '/annees-scolaires',
        icone: CalendarRange,
        roles: ['SCHOOL_ADMIN', 'ADMIN'],
      },
      { libelle: "Journal d'audit", chemin: '/journal-audit', icone: ScrollText, roles: ['SCHOOL_ADMIN'] },
    ],
  },
  {
    titre: 'Documents et communication',
    entrees: [
      {
        libelle: 'Centre documentaire',
        chemin: '/documents',
        icone: FileText,
        roles: ['SCHOOL_ADMIN', 'ADMIN', 'SECRETARY'],
      },
      {
        libelle: 'Annonces',
        chemin: '/communication/annonces',
        icone: Megaphone,
        roles: ['SCHOOL_ADMIN', 'ADMIN'],
      },
      {
        libelle: 'Notifications',
        chemin: '/notifications',
        icone: Bell,
        roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACADEMIC_HEAD', 'SECRETARY', 'ACCOUNTANT', 'TEACHER'],
      },
    ],
  },
]
