import { useState } from 'react'
import { Alerte, Bouton, Modale, ZoneTexte } from '../../../ui'
import { formaterNomComplet } from '../../../communs'
import type { Eleve } from '../../../socle/modeles/scolarite'

interface Props {
  eleve: Eleve | null
  onFermer: () => void
  onConfirmer: (motif: string) => void
  chargement?: boolean
}

/**
 * L'archivage ne supprime rien : le dossier et son historique restent
 * consultables. Seule l'inscription active se referme. C'est pourquoi le
 * motif est obligatoire, comme toute opération qui referme durablement un
 * dossier.
 */
export function ModaleArchivage({ eleve, onFermer, onConfirmer, chargement }: Props) {
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState('')

  const fermer = () => {
    setMotif('')
    setErreur('')
    onFermer()
  }

  return (
    <Modale
      ouverte={eleve !== null}
      onFermer={fermer}
      titre={`Archiver le dossier de ${eleve ? formaterNomComplet(eleve.firstName, eleve.lastName) : ''}`}
      taille="sm"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton
            variante="danger"
            chargement={chargement}
            onClick={() => {
              if (motif.trim().length < 5) {
                setErreur('Le motif est obligatoire et doit être explicite.')
                return
              }
              onConfirmer(motif.trim())
              setMotif('')
              setErreur('')
            }}
          >
            Archiver le dossier
          </Bouton>
        </>
      }
    >
      <Alerte ton="alerte">
        Le dossier et son historique restent consultables. L'inscription en cours se ferme et l'élève
        n'apparaîtra plus dans les listes actives.
      </Alerte>
      <ZoneTexte
        libelle="Motif"
        requis
        rows={3}
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        erreur={erreur}
        placeholder="Fin de scolarité, transfert vers un autre établissement"
      />
    </Modale>
  )
}
