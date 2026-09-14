/** Routes du lot A · PROPRIETAIRE : Boris */
import { lazy } from 'react'
import type { RouteObject } from 'react-router'
import { ExigeRole } from '../socle/gardes/ExigeRole'
import EnConstruction from '../modules/EnConstruction'

const ListeUtilisateurs = lazy(() => import('../modules/utilisateurs/pages/ListeUtilisateurs'))
const AssistantConfiguration = lazy(() => import('../modules/etablissement/pages/AssistantConfiguration'))
const IdentiteEtablissement = lazy(() => import('../modules/etablissement/pages/IdentiteEtablissement'))
const ParametresEtablissement = lazy(() => import('../modules/etablissement/pages/ParametresEtablissement'))
const ListeAnneesScolaires = lazy(() => import('../modules/annees-scolaires/pages/ListeAnneesScolaires'))
const PeriodesAnnee = lazy(() => import('../modules/annees-scolaires/pages/PeriodesAnnee'))
const JournalAudit = lazy(() => import('../modules/journal-audit/pages/JournalAudit'))
const TableauDeBord = lazy(() => import('../modules/tableaux-de-bord/pages/TableauDeBord'))

export const routesAdministration: RouteObject[] = [
  { index: true, element: <TableauDeBord /> },
  { path: 'tableau-de-bord', element: <TableauDeBord /> },
  {
    path: 'utilisateurs',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN', 'ADMIN']}>
        <ListeUtilisateurs />
      </ExigeRole>
    ),
  },
  {
    path: 'établissement/configuration',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN']}>
        <AssistantConfiguration />
      </ExigeRole>
    ),
  },
  {
    path: 'établissement/identité',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN', 'ADMIN']}>
        <IdentiteEtablissement />
      </ExigeRole>
    ),
  },
  {
    path: 'établissement/paramètres',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN']}>
        <ParametresEtablissement />
      </ExigeRole>
    ),
  },
  {
    path: 'annees-scolaires',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN', 'ADMIN']}>
        <ListeAnneesScolaires />
      </ExigeRole>
    ),
  },
  {
    path: 'années-scolaires/:id/périodes',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN', 'ADMIN']}>
        <PeriodesAnnee />
      </ExigeRole>
    ),
  },
  {
    path: 'journal-audit',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN']}>
        <JournalAudit />
      </ExigeRole>
    ),
  },
  { path: 'recherche', element: <EnConstruction titre="Recherche globale" /> },
  { path: 'documents', element: <EnConstruction titre="Centre documentaire" /> },
  { path: 'communication/annonces', element: <EnConstruction titre="Annonces" /> },
  { path: 'notifications', element: <EnConstruction titre="Notifications" /> },
]
