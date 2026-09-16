/** Routes du lot C · PROPRIÉTAIRE : Fabrice */
import { lazy } from 'react'
import { Navigate } from 'react-router'
import type { RouteObject } from 'react-router'
import EnConstruction from '../modules/EnConstruction'

const ListeEvaluations = lazy(() => import('../modules/evaluations/pages/ListeEvaluations'))
const GrilleSaisieNotes = lazy(() => import('../modules/notes/pages/GrilleSaisieNotes'))

export const routesAcademique: RouteObject[] = [
  { path: 'evaluations', element: <ListeEvaluations /> },
  { path: 'evaluations/:id/notes', element: <GrilleSaisieNotes /> },
  // « Saisie des notes » du menu renvoie vers la liste : on choisit
  // l'évaluation à noter avant d'ouvrir sa grille.
  { path: 'notes', element: <Navigate to="/evaluations" replace /> },
  { path: 'bulletins', element: <EnConstruction titre="Bulletins" /> },
  { path: 'absences', element: <EnConstruction titre="Absences et retards" /> },
  { path: 'absences/appel', element: <EnConstruction titre="Feuille d'appel" /> },
  { path: 'discipline', element: <EnConstruction titre="Discipline" /> },
  { path: 'planning-evaluations', element: <EnConstruction titre="Planning des évaluations" /> },
  { path: 'analyses/evolution', element: <EnConstruction titre="Évolution des apprenants" /> },
  { path: 'analyses/eleves-a-risque', element: <EnConstruction titre="Élèves à risque" /> },
]
