/** Routes du lot A · PROPRIETAIRE : Boris */
import { lazy } from 'react'
import type { RouteObject } from 'react-router'
import { ExigeRole } from '../socle/gardes/ExigeRole'

const ListeUtilisateurs = lazy(() => import('../modules/utilisateurs/pages/ListeUtilisateurs'))
const AssistantConfiguration = lazy(() => import('../modules/etablissement/pages/AssistantConfiguration'))
const IdentiteEtablissement = lazy(() => import('../modules/etablissement/pages/IdentiteEtablissement'))
const ParametresEtablissement = lazy(() => import('../modules/etablissement/pages/ParametresEtablissement'))
const ListeAnneesScolaires = lazy(() => import('../modules/annees-scolaires/pages/ListeAnneesScolaires'))
const PeriodesAnnee = lazy(() => import('../modules/annees-scolaires/pages/PeriodesAnnee'))
const JournalAudit = lazy(() => import('../modules/journal-audit/pages/JournalAudit'))
const CentreDocumentaire = lazy(() => import('../modules/documents/pages/CentreDocumentaire'))
const GenerationLot = lazy(() => import('../modules/documents/pages/GenerationLot'))
const ApercuDocument = lazy(() => import('../modules/documents/pages/ApercuDocument'))
const ModelesDocuments = lazy(() => import('../modules/modeles-documents/pages/ModelesDocuments'))
const ListeAnnonces = lazy(() => import('../modules/annonces/pages/ListeAnnonces'))
const RedigerAnnonce = lazy(() => import('../modules/annonces/pages/RedigerAnnonce'))
const CentreNotifications = lazy(() => import('../modules/notifications/pages/CentreNotifications'))
const RechercheGlobale = lazy(() => import('../modules/recherche/pages/RechercheGlobale'))
const FicheUtilisateur = lazy(() => import('../modules/utilisateurs/pages/FicheUtilisateur'))
const MatricePermissions = lazy(() => import('../modules/utilisateurs/pages/MatricePermissions'))
const AnnoncesRecues = lazy(() => import('../modules/annonces/pages/AnnoncesRecues'))
const TableauDeBord = lazy(() => import('../modules/tableaux-de-bord/pages/TableauDeBord'))

export const routesAdministration: RouteObject[] = [
  { index: true, element: <TableauDeBord /> },
  { path: 'tableau-de-bord', element: <TableauDeBord /> },
  {
    // Ordre important : le chemin fixe doit précéder le chemin paramétré,
    // sinon « permissions » serait interprété comme un identifiant.
    path: 'utilisateurs/permissions',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN']}>
        <MatricePermissions />
      </ExigeRole>
    ),
  },
  {
    path: 'utilisateurs/:id',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN', 'ADMIN']}>
        <FicheUtilisateur />
      </ExigeRole>
    ),
  },
  {
    // Consultation ouverte à tous les rôles : c'est la cible des
    // notifications d'annonce.
    path: 'annonces',
    element: <AnnoncesRecues />,
  },
  {
    path: 'utilisateurs',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN', 'ADMIN']}>
        <ListeUtilisateurs />
      </ExigeRole>
    ),
  },
  {
    path: 'etablissement/configuration',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN']}>
        <AssistantConfiguration />
      </ExigeRole>
    ),
  },
  {
    path: 'etablissement/identite',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN', 'ADMIN']}>
        <IdentiteEtablissement />
      </ExigeRole>
    ),
  },
  {
    path: 'etablissement/parametres',
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
    path: 'annees-scolaires/:id/periodes',
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
  { path: 'recherche', element: <RechercheGlobale /> },
  {
    path: 'documents',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN', 'ADMIN', 'SECRETARY', 'ACADEMIC_HEAD', 'ACCOUNTANT']}>
        <CentreDocumentaire />
      </ExigeRole>
    ),
  },
  {
    path: 'documents/modeles',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN']}>
        <ModelesDocuments />
      </ExigeRole>
    ),
  },
  {
    path: 'documents/generation-lot',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN', 'ADMIN', 'SECRETARY', 'ACADEMIC_HEAD']}>
        <GenerationLot />
      </ExigeRole>
    ),
  },
  {
    path: 'documents/:id/apercu',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN', 'ADMIN', 'SECRETARY', 'ACADEMIC_HEAD', 'ACCOUNTANT']}>
        <ApercuDocument />
      </ExigeRole>
    ),
  },
  {
    path: 'communication/annonces',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN', 'ADMIN']}>
        <ListeAnnonces />
      </ExigeRole>
    ),
  },
  {
    path: 'communication/annonces/nouvelle',
    element: (
      <ExigeRole roles={['SCHOOL_ADMIN', 'ADMIN']}>
        <RedigerAnnonce />
      </ExigeRole>
    ),
  },
  { path: 'notifications', element: <CentreNotifications /> },
]
