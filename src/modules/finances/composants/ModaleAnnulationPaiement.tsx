import { useState } from 'react'
import { Bouton, Modale, ZoneTexte } from '../../../ui'
import type { Paiement } from '../../../socle/modeles/finances'

interface Props {
  paiement: Paiement | null
  onFermer: () => void
  onConfirmer: (motif: string) => void
  chargement?: boolean
}

/** Un paiement ne se supprime jamais : il s'annule, avec motif obligatoire. */
export function ModaleAnnulationPaiement({ paiement, onFermer, onConfirmer, chargement }: Props) {
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState('')

  const fermer = () => {
    setMotif('')
    setErreur('')
    onFermer()
  }

  return (
    <Modale
      ouverte={paiement !== null}
      onFermer={fermer}
      titre={`Annuler le paiement ${paiement?.reference ?? ''}`}
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
            Annuler le paiement
          </Bouton>
        </>
      }
    >
      <ZoneTexte
        libelle="Motif"
        requis
        rows={3}
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        erreur={erreur}
        placeholder="Paiement enregistré en double"
      />
    </Modale>
  )
}
