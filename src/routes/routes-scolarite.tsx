/** Routes du lot B · PROPRIETAIRE : Alida */
import { lazy } from 'react'
import type { RouteObject } from 'react-router'
import { ExigeRole } from '../socle/gardes/ExigeRole'

const ListeEleves = lazy(() => import('../modules/eleves/pages/ListeEleves'))
const NouvelEleve = lazy(() => import('../modules/eleves/pages/NouvelEleve'))
const FicheEleve = lazy(() => import('../modules/eleves/pages/FicheEleve'))
const ListeClasses = lazy(() => import('../modules/classes/pages/ListeClasses'))
const FicheClasse = lazy(() => import('../modules/classes/pages/FicheClasse'))
const ListeEnseignants = lazy(() => import('../modules/enseignants/pages/ListeEnseignants'))
const FicheEnseignant = lazy(() => import('../modules/enseignants/pages/FicheEnseignant'))
const ListeMatieres = lazy(() => import('../modules/matieres/pages/ListeMatieres'))
const ListeSalles = lazy(() => import('../modules/salles/pages/ListeSalles'))
const ListeInscriptions = lazy(() => import('../modules/inscriptions/pages/ListeInscriptions'))
const ListeAffectations = lazy(() => import('../modules/affectations/pages/ListeAffectations'))
const ListeFrais = lazy(() => import('../modules/finances/pages/ListeFrais'))
const ListePaiements = lazy(() => import('../modules/finances/pages/ListePaiements'))
const ListesFinancieres = lazy(() => import('../modules/finances/pages/ListesFinancieres'))
const EmploiDuTemps = lazy(() => import('../modules/emploi-du-temps/pages/EmploiDuTemps'))

// Les rôles ci-dessous reprennent exactement ceux déjà déclarés dans
// menu-scolarite.ts : le menu exprimait déjà qui devait voir chaque écran,
// mais ne faisait qu'un habillage visuel — rien ne l'appliquait au niveau
// de la route elle-même. Un compte qui devinait l'URL passait outre. La
// même liste de rôles ne doit exister qu'à un seul endroit ; c'est le menu
// qui reste la source, ici on l'applique simplement pour de vrai.
const ROLES_ELEVES = ['SCHOOL_ADMIN', 'ADMIN', 'SECRETARY'] as const
const ROLES_ENSEIGNANTS = ['SCHOOL_ADMIN', 'ADMIN', 'ACADEMIC_HEAD'] as const
const ROLES_CLASSES = ['SCHOOL_ADMIN', 'ADMIN', 'ACADEMIC_HEAD', 'SECRETARY'] as const
const ROLES_MATIERES = ['SCHOOL_ADMIN', 'ACADEMIC_HEAD'] as const
const ROLES_SALLES = ['SCHOOL_ADMIN', 'ADMIN'] as const
const ROLES_AFFECTATIONS = ['SCHOOL_ADMIN', 'ADMIN', 'ACADEMIC_HEAD'] as const
const ROLES_EMPLOI_DU_TEMPS = ['SCHOOL_ADMIN', 'ACADEMIC_HEAD', 'TEACHER'] as const
const ROLES_FINANCE = ['SCHOOL_ADMIN', 'ACCOUNTANT'] as const

export const routesScolarite: RouteObject[] = [
  {
    path: 'eleves',
    element: (
      <ExigeRole roles={[...ROLES_ELEVES]}>
        <ListeEleves />
      </ExigeRole>
    ),
  },
  {
    path: 'eleves/nouveau',
    element: (
      <ExigeRole roles={[...ROLES_ELEVES]}>
        <NouvelEleve />
      </ExigeRole>
    ),
  },
  {
    // Consultée aussi par un enseignant (onglets Résultats, Vie scolaire) :
    // la fiche elle-même reste ouverte à tous les rôles authentifiés,
    // chaque onglet appliquant sa propre restriction si besoin.
    path: 'eleves/:id',
    element: <FicheEleve />,
  },
  {
    path: 'inscriptions',
    element: (
      <ExigeRole roles={[...ROLES_ELEVES]}>
        <ListeInscriptions />
      </ExigeRole>
    ),
  },
  {
    path: 'enseignants',
    element: (
      <ExigeRole roles={[...ROLES_ENSEIGNANTS]}>
        <ListeEnseignants />
      </ExigeRole>
    ),
  },
  {
    // Route ajoutée par l'intégrateur : la recherche globale renvoie ici.
    path: 'enseignants/:id',
    element: (
      <ExigeRole roles={[...ROLES_ENSEIGNANTS]}>
        <FicheEnseignant />
      </ExigeRole>
    ),
  },
  {
    path: 'classes',
    element: (
      <ExigeRole roles={[...ROLES_CLASSES]}>
        <ListeClasses />
      </ExigeRole>
    ),
  },
  {
    // Route ajoutée par l'intégrateur : la recherche globale renvoie ici.
    path: 'classes/:id',
    element: (
      <ExigeRole roles={[...ROLES_CLASSES]}>
        <FicheClasse />
      </ExigeRole>
    ),
  },
  {
    path: 'matieres',
    element: (
      <ExigeRole roles={[...ROLES_MATIERES]}>
        <ListeMatieres />
      </ExigeRole>
    ),
  },
  {
    path: 'salles',
    element: (
      <ExigeRole roles={[...ROLES_SALLES]}>
        <ListeSalles />
      </ExigeRole>
    ),
  },
  {
    path: 'affectations',
    element: (
      <ExigeRole roles={[...ROLES_AFFECTATIONS]}>
        <ListeAffectations />
      </ExigeRole>
    ),
  },
  {
    path: 'emploi-du-temps',
    element: (
      <ExigeRole roles={[...ROLES_EMPLOI_DU_TEMPS]}>
        <EmploiDuTemps />
      </ExigeRole>
    ),
  },
  {
    path: 'finance/frais',
    element: (
      <ExigeRole roles={[...ROLES_FINANCE]}>
        <ListeFrais />
      </ExigeRole>
    ),
  },
  {
    path: 'finance/paiements',
    element: (
      <ExigeRole roles={[...ROLES_FINANCE]}>
        <ListePaiements />
      </ExigeRole>
    ),
  },
  {
    path: 'finance/listes',
    element: (
      <ExigeRole roles={[...ROLES_FINANCE]}>
        <ListesFinancieres />
      </ExigeRole>
    ),
  },
]
