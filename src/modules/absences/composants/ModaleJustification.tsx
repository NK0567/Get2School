import { useState } from 'react'
import { Bouton, Modale, ZoneTexte } from '../../../ui'
import type { Presence } from '../../../socle/modeles/academique'
import { LIBELLE_TYPE_ABSENCE } from '../api'

interface Props {
  presence: Presence | null
  eleveNom: string
  onFermer: () => void
  onConfirmer: (motif: string) => void
  chargement?: boolean
}

/**
 * Traitement du justificatif, en deux temps distincts de la déclaration :
 * l'absence existe déjà, non justifiée ; ce geste la fait seulement passer
 * à justifiée, avec le motif indiqué par la famille ou l'élève.
 */
export function ModaleJustification({ presence, eleveNom, onFermer, onConfirmer, chargement }: Props) {
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState('')

  const fermer = () => {
    setMotif('')
    setErreur('')
    onFermer()
  }

  return (
    <Modale
      ouverte={presence !== null}
      onFermer={fermer}
      titre={`Justifier ${presence ? LIBELLE_TYPE_ABSENCE[presence.type].toLowerCase() : ''} de ${eleveNom}`}
      taille="sm"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton
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
            Marquer comme justifiée
          </Bouton>
        </>
      }
    >
      <ZoneTexte
        libelle="Motif du justificatif"
        requis
        rows={3}
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        erreur={erreur}
        placeholder="Certificat médical remis le 14 octobre"
      />
    </Modale>
  )
}
