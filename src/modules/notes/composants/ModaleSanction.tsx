import { useState } from 'react'
import { Alerte, Bouton, Modale, ZoneTexte } from '../../../ui'

interface Props {
  ouverte: boolean
  eleveNom: string
  onFermer: () => void
  onConfirmer: (motif: string) => void
  chargement?: boolean
}

/**
 * Sanctionner une note vs. corriger une note : deux gestes différents.
 *
 * La correction change une valeur saisie par erreur, avec trace au journal.
 * La sanction juge une faute de l'élève (fraude, copie non rendue) : elle
 * exige un motif, la note reste visible et barrée, et son effet sur la
 * moyenne dépend de penaltyPolicy réglé par l'établissement — jamais une
 * suppression (RG-07).
 */
export function ModaleSanction({ ouverte, eleveNom, onFermer, onConfirmer, chargement }: Props) {
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState('')

  const fermer = () => {
    setMotif('')
    setErreur('')
    onFermer()
  }

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre={`Sanctionner la note de ${eleveNom}`}
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
            Sanctionner la note
          </Bouton>
        </>
      }
    >
      <Alerte ton="alerte">
        La note reste visible, barrée, avec le motif en infobulle. Elle n'est jamais supprimée. Selon le
        réglage de l'établissement, elle comptera soit comme un zéro, soit sera retirée du calcul de la
        moyenne avec son coefficient.
      </Alerte>
      <ZoneTexte
        libelle="Motif"
        requis
        rows={3}
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        erreur={erreur}
        placeholder="Copie identique à celle d'un autre élève"
      />
    </Modale>
  )
}
