import type { ReactNode } from 'react'
import { EnteteDePage, EtatVide, SqueletteTableau, Tableau } from '../../ui'
import type { Colonne, EtatTri } from '../../ui'
import { Pagination } from '../composants/Pagination'

interface Props<T> {
  titre: string
  sousTitre?: string
  filAriane?: string[]
  /** Boutons d'action, à droite du titre. */
  actions?: ReactNode
  /** Barre de filtres. Mettre ChampRecherche en premier, à gauche. */
  filtres?: ReactNode
  /** Bandeau d'alerte dependant des données, entre les filtres et le tableau. */
  alerte?: ReactNode

  chargement: boolean
  erreur?: unknown
  lignes?: T[]
  colonnes: Colonne<T>[]
  cleLigne: (ligne: T) => string
  onLigneCliquee?: (ligne: T) => void

  tri?: EtatTri
  onTri?: (cle: string) => void

  vide?: { titre: string; description?: string; icone?: ReactNode; action?: ReactNode }
  pagination?: { page: number; taille: number; total: number; onChange: (page: number) => void }
}

/**
 * Gabarit de page liste · PROPRIETAIRE : Boris
 *
 * Utilisez-le pour TOUTES vos listes. Il impose l'ordre de la charte
 * (en-tête, filtres, tableau, pagination) et géré les quatre états exiges
 * par la Definition of Done : chargement, données, liste vide, erreur.
 *
 * Vous n'avez plus a y penser, et les trois lots se ressemblent.
 */
export function GabaritListe<T>({
  titre,
  sousTitre,
  filAriane,
  actions,
  filtres,
  alerte,
  chargement,
  erreur,
  lignes,
  colonnes,
  cleLigne,
  onLigneCliquee,
  tri,
  onTri,
  vide,
  pagination,
}: Props<T>) {
  const message = (erreur as { message?: string } | null)?.message

  return (
    <>
      <EnteteDePage titre={titre} sousTitre={sousTitre} filAriane={filAriane} actions={actions} />

      {filtres && <div className="mb-4 flex flex-wrap items-end gap-3">{filtres}</div>}
      {alerte}

      {chargement && <SqueletteTableau lignes={6} colonnes={colonnes.length} />}

      {!chargement && erreur != null && (
        <EtatVide
          titre="Impossible de charger ces données"
          description={message ?? 'Réessayez dans un instant.'}
        />
      )}

      {!chargement && erreur == null && lignes && lignes.length === 0 && (
        <EtatVide
          titre={vide?.titre ?? 'Aucun résultat'}
          description={vide?.description ?? 'Modifiez vos critères de recherche.'}
          icone={vide?.icone}
          action={vide?.action}
        />
      )}

      {!chargement && erreur == null && lignes && lignes.length > 0 && (
        <>
          <Tableau
            colonnes={colonnes}
            lignes={lignes}
            cleLigne={cleLigne}
            onLigneCliquee={onLigneCliquee}
            tri={tri}
            onTri={onTri}
          />
          {pagination && (
            <Pagination
              page={pagination.page}
              taille={pagination.taille}
              total={pagination.total}
              onChange={pagination.onChange}
            />
          )}
        </>
      )}
    </>
  )
}
