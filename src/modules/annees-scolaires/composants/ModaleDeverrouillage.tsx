import { useState } from 'react'
import { Alerte, Bouton, Modale, ZoneTexte } from '../../../ui'
import type { Periode } from '../../../socle/modeles/administration'

interface Props {
  periode: Periode | null
  onFermer: () => void
  onConfirmer: (motif: string) => void
  chargement?: boolean
}

/**
 * Déverrouiller une période rouvre la saisie des notes sur un trimestre déjà
 * valide. Le motif est obligatoire et part au journal d'audit : c'est la seule
 * garantie qu'une correction tardive reste traçable.
 */
export function ModaleDeverrouillage({ periode, onFermer, onConfirmer, chargement }: Props) {
  const [motif, setMotif] = useState('')
  const [erreur, setErreur] = useState('')

  const fermer = () => {
    setMotif('')
    setErreur('')
    onFermer()
  }

  const valider = () => {
    if (motif.trim().length < 5) {
      setErreur('Le motif est obligatoire et doit être explicite.')
      return
    }
    onConfirmer(motif.trim())
    setMotif('')
    setErreur('')
  }

  return (
    <Modale
      ouverte={periode !== null}
      onFermer={fermer}
      titre={`Déverrouiller ${periode?.label ?? ''}`}
      taille="sm"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton variante="danger" chargement={chargement} onClick={valider}>
            Déverrouiller la période
          </Bouton>
        </>
      }
    >
      <Alerte ton="danger">
        Les enseignants pourront de nouveau modifier les notes de cette période. Les bulletins déjà générés ne
        refléteront plus forcément les notes en base.
      </Alerte>

      <ZoneTexte
        libelle="Motif du déverrouillage"
        requis
        rows={3}
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        erreur={erreur}
        placeholder="Erreur de saisie signalée par le conseil de classe du 12 janvier"
        aide="Ce motif apparaîtra dans le journal d'audit."
      />
    </Modale>
  )
}
