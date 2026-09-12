/** Routes du lot B · PROPRIETAIRE : Alida */
import type { RouteObject } from 'react-router'
import EnConstruction from '../modules/EnConstruction'

export const routesScolarite: RouteObject[] = [
  { path: 'eleves', element: <EnConstruction titre="Eleves" /> },
  { path: 'eleves/nouveau', element: <EnConstruction titre="Nouvel eleve" /> },
  { path: 'eleves/:id', element: <EnConstruction titre="Fiche eleve" /> },
  { path: 'inscriptions', element: <EnConstruction titre="Inscriptions" /> },
  { path: 'enseignants', element: <EnConstruction titre="Enseignants" /> },
  { path: 'classes', element: <EnConstruction titre="Classes" /> },
  { path: 'matieres', element: <EnConstruction titre="Matieres" /> },
  { path: 'salles', element: <EnConstruction titre="Salles" /> },
  { path: 'affectations', element: <EnConstruction titre="Affectations" /> },
  { path: 'emploi-du-temps', element: <EnConstruction titre="Emploi du temps" /> },
  { path: 'finance/frais', element: <EnConstruction titre="Frais et echeances" /> },
  { path: 'finance/paiements', element: <EnConstruction titre="Paiements" /> },
  { path: 'finance/listes', element: <EnConstruction titre="Listes financieres" /> },
]
