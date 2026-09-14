/**
 * Routes communes aux trois lots · PROPRIETAIRE : Boris · FIGE
 *
 * Écrans disponibles pour tous les rôles : profil, accès refusé, page
 * inexistante. Ne pas y ajouter de route métier.
 */
import { lazy } from 'react'
import type { RouteObject } from 'react-router'

const MonProfil = lazy(() => import('../modules/profil/pages/MonProfil'))
const PageAccesRefuse = lazy(() => import('../modules/erreurs/pages/PageAccesRefuse'))
const PageNonTrouvee = lazy(() => import('../modules/erreurs/pages/PageNonTrouvee'))

export const routesCommunes: RouteObject[] = [
  { path: 'profil', element: <MonProfil /> },
  { path: 'acces-refuse', element: <PageAccesRefuse /> },
  { path: '*', element: <PageNonTrouvee /> },
]
