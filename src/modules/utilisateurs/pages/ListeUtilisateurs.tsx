/**
 * ECRAN DE REFERENCE DU PROJET
 *
 * Alida et Fabrice : c'est le patron a copier pour toutes vos listes.
 * Il montre les quatre etats exiges par la Definition of Done (chargement,
 * donnees, liste vide, erreur), les filtres, la pagination, le controle de
 * role, la modale de creation avec validation, le toast de confirmation et
 * l'appel au journal d'audit.
 */
import { useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import {
  Badge,
  Bouton,
  Champ,
  DialogueConfirmation,
  EnteteDePage,
  EtatVide,
  Selecteur,
  SqueletteTableau,
  Tableau,
  useToast,
} from '../../../ui'
import type { Colonne } from '../../../ui'
import { LIBELLE_ROLE, ROLES } from '../../../socle/modeles/communs'
import type { Role } from '../../../socle/modeles/communs'
import type { Utilisateur } from '../../../socle/modeles/administration'
import { useChangerStatut, useUtilisateurs } from '../hooks/useUtilisateurs'
import { ModaleNouvelUtilisateur } from '../composants/ModaleNouvelUtilisateur'

export default function ListeUtilisateurs() {
  const toast = useToast()
  const [recherche, setRecherche] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [page, setPage] = useState(0)
  const [creationOuverte, setCreationOuverte] = useState(false)
  const [aDesactiver, setADesactiver] = useState<Utilisateur | null>(null)

  const { data, isLoading, isError, error } = useUtilisateurs({ recherche, role, page, taille: 10 })
  const changerStatut = useChangerStatut()

  const colonnes: Colonne<Utilisateur>[] = [
    {
      cle: 'nom',
      entete: 'Nom',
      rendu: (u) => (
        <div>
          <div className="font-medium">
            {u.firstName} {u.lastName}
          </div>
          <div className="text-muted text-xs">{u.email}</div>
        </div>
      ),
    },
    { cle: 'role', entete: 'Role', rendu: (u) => LIBELLE_ROLE[u.role] },
    {
      cle: 'statut',
      entete: 'Statut',
      rendu: (u) => (
        <Badge ton={u.isActive ? 'succes' : 'neutre'}>{u.isActive ? 'Actif' : 'Desactive'}</Badge>
      ),
    },
    {
      cle: 'connexion',
      entete: 'Derniere connexion',
      rendu: (u) => (
        <span className="text-muted tabular-nums">
          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR') : 'Jamais'}
        </span>
      ),
    },
    {
      cle: 'actions',
      entete: '',
      className: 'text-right',
      rendu: (u) => (
        <Bouton
          variante="fantome"
          taille="sm"
          onClick={(e) => {
            e.stopPropagation()
            if (u.isActive) setADesactiver(u)
            else void changerStatut.mutateAsync({ utilisateur: u, actif: true })
          }}
        >
          {u.isActive ? 'Desactiver' : 'Reactiver'}
        </Bouton>
      ),
    },
  ]

  const total = data?.total ?? 0
  const nbPages = Math.ceil(total / 10)

  return (
    <>
      <EnteteDePage
        titre="Utilisateurs"
        sousTitre={`${total} compte(s) dans l'etablissement`}
        filAriane={['Administration']}
        actions={
          <Bouton icone={<Plus className="h-4 w-4" />} onClick={() => setCreationOuverte(true)}>
            Nouvel utilisateur
          </Bouton>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Champ
          placeholder="Rechercher un nom ou une adresse"
          value={recherche}
          onChange={(e) => {
            setRecherche(e.target.value)
            setPage(0)
          }}
          className="w-72"
        />
        <Selecteur
          value={role}
          onChange={(e) => {
            setRole(e.target.value as Role | '')
            setPage(0)
          }}
          placeholder="Tous les roles"
          options={ROLES.map((r) => ({ valeur: r, libelle: LIBELLE_ROLE[r] }))}
        />
      </div>

      {isLoading && <SqueletteTableau lignes={6} colonnes={5} />}

      {isError && (
        <EtatVide
          titre="Impossible de charger les utilisateurs"
          description={(error as { message?: string })?.message}
        />
      )}

      {data && data.contenu.length === 0 && (
        <EtatVide
          titre="Aucun utilisateur ne correspond a ces criteres"
          description="Modifiez la recherche ou creez un nouveau compte."
          icone={<UserPlus className="h-8 w-8" />}
          action={<Bouton onClick={() => setCreationOuverte(true)}>Nouvel utilisateur</Bouton>}
        />
      )}

      {data && data.contenu.length > 0 && (
        <>
          <Tableau colonnes={colonnes} lignes={data.contenu} cleLigne={(u) => u.id} />
          {nbPages > 1 && (
            <div className="text-muted mt-3 flex items-center justify-end gap-2 text-[13px]">
              <Bouton
                variante="secondaire"
                taille="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Precedent
              </Bouton>
              <span className="tabular-nums">
                Page {page + 1} sur {nbPages}
              </span>
              <Bouton
                variante="secondaire"
                taille="sm"
                disabled={page + 1 >= nbPages}
                onClick={() => setPage(page + 1)}
              >
                Suivant
              </Bouton>
            </div>
          )}
        </>
      )}

      <ModaleNouvelUtilisateur ouverte={creationOuverte} onFermer={() => setCreationOuverte(false)} />

      <DialogueConfirmation
        ouverte={aDesactiver !== null}
        onFermer={() => setADesactiver(null)}
        titre="Desactiver ce compte"
        message={`${aDesactiver?.firstName} ${aDesactiver?.lastName} ne pourra plus se connecter. Ses donnees et son historique sont conserves.`}
        libelleAction="Desactiver le compte"
        chargement={changerStatut.isPending}
        onConfirmer={async () => {
          if (!aDesactiver) return
          await changerStatut.mutateAsync({ utilisateur: aDesactiver, actif: false })
          toast('succes', 'Le compte a ete desactive.')
          setADesactiver(null)
        }}
      />
    </>
  )
}
