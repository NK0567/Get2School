/**
 * ECRAN DE REFERENCE DU PROJET
 *
 * Alida et Fabrice : c'est le patron a copier pour toutes vos listes.
 * Il tient en 150 lignes parce que la base commune s'occupe du reste, et il
 * montre toute la chaine :
 *
 *   page  →  hook React Query  →  api.ts  →  axios  →  simulation
 *
 * Y figurent : les quatre etats, la recherche retardee, le tri, la
 * pagination, le menu d'actions, la confirmation nommee, le toast, l'export
 * et l'appel au journal d'audit.
 */
import { useState } from 'react'
import { Ban, CircleCheck, Download, Plus, UserPlus } from 'lucide-react'
import { Bouton, DialogueConfirmation, MenuActions, Selecteur, useToast } from '../../../ui'
import type { ActionMenu, Colonne } from '../../../ui'
import {
  BadgeStatut,
  ChampRecherche,
  GabaritListe,
  exporterCsv,
  formaterDate,
  formaterNomComplet,
  nomFichierDate,
  useConfirmation,
  useDebounce,
  usePagination,
  useTri,
} from '../../../communs'
import { LIBELLE_ROLE, ROLES } from '../../../socle/modeles/communs'
import type { Role } from '../../../socle/modeles/communs'
import type { Utilisateur } from '../../../socle/modeles/administration'
import { useChangerStatut, useUtilisateurs } from '../hooks/useUtilisateurs'
import { ModaleNouvelUtilisateur } from '../composants/ModaleNouvelUtilisateur'

const EXTRACTEURS = {
  nom: (u: Utilisateur) => `${u.lastName} ${u.firstName}`.toLowerCase(),
  role: (u: Utilisateur) => LIBELLE_ROLE[u.role],
  connexion: (u: Utilisateur) => u.lastLoginAt ?? '',
}

export default function ListeUtilisateurs() {
  const toast = useToast()
  const { page, taille, setPage, reinitialiser } = usePagination(10)

  const [recherche, setRecherche] = useState('')
  const rechercheRetardee = useDebounce(recherche)
  const [role, setRole] = useState<Role | ''>('')
  const [creationOuverte, setCreationOuverte] = useState(false)

  const requete = useUtilisateurs({ recherche: rechercheRetardee, role, page, taille })
  const changerStatut = useChangerStatut()
  const desactivation = useConfirmation<Utilisateur>()
  const { tri, basculer, lignes } = useTri(requete.data?.contenu, EXTRACTEURS)

  const actionsDe = (u: Utilisateur): ActionMenu[] => [
    u.isActive
      ? {
          libelle: 'Desactiver le compte',
          icone: <Ban className="h-4 w-4" />,
          destructif: true,
          onClick: () => desactivation.demander(u),
        }
      : {
          libelle: 'Reactiver le compte',
          icone: <CircleCheck className="h-4 w-4" />,
          onClick: () => void changerStatut.mutateAsync({ utilisateur: u, actif: true }),
        },
    {
      libelle: 'Reinitialiser le mot de passe',
      onClick: () => {},
      desactiveeCar: 'Disponible quand le backend sera en ligne',
    },
  ]

  const colonnes: Colonne<Utilisateur>[] = [
    {
      cle: 'nom',
      entete: 'Nom',
      triable: true,
      rendu: (u) => (
        <div>
          <div className="font-medium">{formaterNomComplet(u.firstName, u.lastName)}</div>
          <div className="text-muted text-xs">{u.email}</div>
        </div>
      ),
    },
    { cle: 'role', entete: 'Role', triable: true, rendu: (u) => LIBELLE_ROLE[u.role] },
    {
      cle: 'statut',
      entete: 'Statut',
      rendu: (u) => <BadgeStatut valeur={u.isActive ? 'ACTIF' : 'INACTIF'} />,
    },
    {
      cle: 'connexion',
      entete: 'Derniere connexion',
      triable: true,
      rendu: (u) => (
        <span className="text-muted tabular-nums">
          {u.lastLoginAt ? formaterDate(u.lastLoginAt) : 'Jamais'}
        </span>
      ),
    },
    {
      cle: 'actions',
      entete: '',
      className: 'text-right',
      rendu: (u) => <MenuActions actions={actionsDe(u)} />,
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Utilisateurs"
        sousTitre={`${requete.data?.total ?? 0} compte(s) dans l'etablissement`}
        filAriane={['Administration']}
        actions={
          <>
            <Bouton
              variante="secondaire"
              icone={<Download className="h-4 w-4" />}
              disabled={!lignes?.length}
              onClick={() =>
                exporterCsv(
                  nomFichierDate('utilisateurs'),
                  [
                    {
                      entete: 'Nom',
                      valeur: (u: Utilisateur) => formaterNomComplet(u.firstName, u.lastName),
                    },
                    { entete: 'Adresse', valeur: (u: Utilisateur) => u.email },
                    { entete: 'Role', valeur: (u: Utilisateur) => LIBELLE_ROLE[u.role] },
                    { entete: 'Statut', valeur: (u: Utilisateur) => (u.isActive ? 'Actif' : 'Desactive') },
                  ],
                  lignes ?? [],
                )
              }
            >
              Exporter
            </Bouton>
            <Bouton icone={<Plus className="h-4 w-4" />} onClick={() => setCreationOuverte(true)}>
              Nouvel utilisateur
            </Bouton>
          </>
        }
        filtres={
          <>
            <ChampRecherche
              valeur={recherche}
              onChange={(v) => {
                setRecherche(v)
                reinitialiser()
              }}
              placeholder="Rechercher un nom ou une adresse"
            />
            <Selecteur
              value={role}
              onChange={(e) => {
                setRole(e.target.value as Role | '')
                reinitialiser()
              }}
              placeholder="Tous les roles"
              options={ROLES.map((r) => ({ valeur: r, libelle: LIBELLE_ROLE[r] }))}
            />
          </>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={lignes}
        colonnes={colonnes}
        cleLigne={(u) => u.id}
        tri={tri}
        onTri={basculer}
        vide={{
          titre: 'Aucun utilisateur ne correspond a ces criteres',
          description: 'Modifiez la recherche ou creez un nouveau compte.',
          icone: <UserPlus className="h-8 w-8" />,
          action: <Bouton onClick={() => setCreationOuverte(true)}>Nouvel utilisateur</Bouton>,
        }}
        pagination={{ page, taille, total: requete.data?.total ?? 0, onChange: setPage }}
      />

      <ModaleNouvelUtilisateur ouverte={creationOuverte} onFermer={() => setCreationOuverte(false)} />

      <DialogueConfirmation
        ouverte={desactivation.ouverte}
        onFermer={desactivation.annuler}
        titre="Desactiver ce compte"
        message={`${formaterNomComplet(desactivation.cible?.firstName, desactivation.cible?.lastName)} ne pourra plus se connecter. Ses donnees et son historique sont conserves.`}
        libelleAction="Desactiver le compte"
        chargement={changerStatut.isPending}
        onConfirmer={async () => {
          if (!desactivation.cible) return
          await changerStatut.mutateAsync({ utilisateur: desactivation.cible, actif: false })
          toast('succes', 'Le compte a ete desactive.')
          desactivation.annuler()
        }}
      />
    </>
  )
}
