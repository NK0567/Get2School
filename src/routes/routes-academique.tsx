/** Routes du lot C · PROPRIÉTAIRE : Fabrice */
import { lazy } from 'react'
import type { RouteObject } from 'react-router'
import { ExigeRole } from '../socle/gardes/ExigeRole'

const ListeEvaluations = lazy(() => import('../modules/evaluations/pages/ListeEvaluations'))
const SaisieNotes = lazy(() => import('../modules/notes/pages/SaisieNotes'))
const GrilleSaisieNotes = lazy(() => import('../modules/notes/pages/GrilleSaisieNotes'))
const ListeBulletins = lazy(() => import('../modules/bulletins/pages/ListeBulletins'))
const ApercuBulletin = lazy(() => import('../modules/bulletins/pages/ApercuBulletin'))
const ListeAbsences = lazy(() => import('../modules/absences/pages/ListeAbsences'))
const FeuilleAppel = lazy(() => import('../modules/absences/pages/FeuilleAppel'))
const RegistreDiscipline = lazy(() => import('../modules/discipline/pages/RegistreDiscipline'))
const ElevesARisque = lazy(() => import('../modules/analyses/pages/ElevesARisque'))
const EvolutionApprenants = lazy(() => import('../modules/analyses/pages/EvolutionApprenants'))
const PlanningEvaluations = lazy(() => import('../modules/planning/pages/PlanningEvaluations'))

// Rôles repris de menu-academique.ts, appliqués ici pour de vrai : un menu
// qui cache une entrée n'empêche personne d'atteindre l'URL directement.
// planning-evaluations n'était dans aucun menu (voir menu-academique.ts,
// corrigé dans le même geste) : rôles alignés sur Évaluations, dont c'est
// la vue transversale.
const ROLES_EVALUATIONS = ['SCHOOL_ADMIN', 'ACADEMIC_HEAD', 'TEACHER'] as const
const ROLES_BULLETINS = ['SCHOOL_ADMIN', 'ACADEMIC_HEAD', 'TEACHER'] as const
const ROLES_ABSENCES = ['SCHOOL_ADMIN', 'ACADEMIC_HEAD', 'TEACHER'] as const
const ROLES_DISCIPLINE = ['SCHOOL_ADMIN', 'ACADEMIC_HEAD'] as const
const ROLES_ANALYSES = ['SCHOOL_ADMIN', 'ACADEMIC_HEAD'] as const

export const routesAcademique: RouteObject[] = [
  {
    path: 'evaluations',
    element: (
      <ExigeRole roles={[...ROLES_EVALUATIONS]}>
        <ListeEvaluations />
      </ExigeRole>
    ),
  },
  {
    path: 'evaluations/:id/notes',
    element: (
      <ExigeRole roles={[...ROLES_EVALUATIONS]}>
        <GrilleSaisieNotes />
      </ExigeRole>
    ),
  },
  {
    path: 'notes',
    element: (
      <ExigeRole roles={[...ROLES_EVALUATIONS]}>
        <SaisieNotes />
      </ExigeRole>
    ),
  },
  {
    path: 'bulletins',
    element: (
      <ExigeRole roles={[...ROLES_BULLETINS]}>
        <ListeBulletins />
      </ExigeRole>
    ),
  },
  {
    path: 'bulletins/:enrollmentId/:periodId',
    element: (
      <ExigeRole roles={[...ROLES_BULLETINS]}>
        <ApercuBulletin />
      </ExigeRole>
    ),
  },
  {
    path: 'absences',
    element: (
      <ExigeRole roles={[...ROLES_ABSENCES]}>
        <ListeAbsences />
      </ExigeRole>
    ),
  },
  {
    path: 'absences/appel',
    element: (
      <ExigeRole roles={[...ROLES_ABSENCES]}>
        <FeuilleAppel />
      </ExigeRole>
    ),
  },
  {
    path: 'discipline',
    element: (
      <ExigeRole roles={[...ROLES_DISCIPLINE]}>
        <RegistreDiscipline />
      </ExigeRole>
    ),
  },
  {
    path: 'planning-evaluations',
    element: (
      <ExigeRole roles={[...ROLES_EVALUATIONS]}>
        <PlanningEvaluations />
      </ExigeRole>
    ),
  },
  {
    path: 'analyses/evolution',
    element: (
      <ExigeRole roles={[...ROLES_ANALYSES]}>
        <EvolutionApprenants />
      </ExigeRole>
    ),
  },
  {
    path: 'analyses/eleves-a-risque',
    element: (
      <ExigeRole roles={[...ROLES_ANALYSES]}>
        <ElevesARisque />
      </ExigeRole>
    ),
  },
]
