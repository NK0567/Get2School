/** Routes du lot C · PROPRIETAIRE : Fabrice */
import type { RouteObject } from 'react-router'
import EnConstruction from '../modules/EnConstruction'

export const routesAcademique: RouteObject[] = [
  { path: 'evaluations', element: <EnConstruction titre="Evaluations" /> },
  { path: 'evaluations/:id/notes', element: <EnConstruction titre="Saisie des notes" /> },
  { path: 'notes', element: <EnConstruction titre="Saisie des notes" /> },
  { path: 'bulletins', element: <EnConstruction titre="Bulletins" /> },
  { path: 'absences', element: <EnConstruction titre="Absences et retards" /> },
  { path: 'absences/appel', element: <EnConstruction titre="Feuille d'appel" /> },
  { path: 'discipline', element: <EnConstruction titre="Discipline" /> },
  { path: 'planning-evaluations', element: <EnConstruction titre="Planning des evaluations" /> },
  { path: 'analyses/evolution', element: <EnConstruction titre="Evolution des apprenants" /> },
  { path: 'analyses/eleves-a-risque', element: <EnConstruction titre="Eleves a risque" /> },
]
