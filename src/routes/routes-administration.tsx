/** Routes du lot A · PROPRIETAIRE : Boris */
import { lazy } from 'react'
import type { RouteObject } from 'react-router'
import { ExigeRole } from '../socle/gardes/ExigeRole'
import EnConstruction from '../modules/EnConstruction'

const ListeUtilisateurs = lazy(() => import('../modules/utilisateurs/pages/ListeUtilisateurs'))
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
  { path: 'etablissement/parametres', element: <EnConstruction titre="Parametres de l'etablissement" /> },
  { path: 'annees-scolaires', element: <EnConstruction titre="Annees scolaires" /> },
  { path: 'journal-audit', element: <EnConstruction titre="Journal d'audit" /> },
  { path: 'recherche', element: <EnConstruction titre="Recherche globale" /> },
  { path: 'documents', element: <EnConstruction titre="Centre documentaire" /> },
  { path: 'communication/annonces', element: <EnConstruction titre="Annonces" /> },
  { path: 'notifications', element: <EnConstruction titre="Notifications" /> },
]
