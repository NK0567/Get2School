import { useState } from 'react'
import { Alerte, Bouton, Modale, ZoneTexte } from '../../../ui'

interface Props {
  ouverte: boolean
  eleveNom: string
  onFermer: () => void
  onConfirmer: (decision: string) => void
  chargement?: boolean
}

/**
 * La décision est un geste distinct du signalement, réservé aux rôles
 * habilités (voir le contrôle de route). Le système ne prononce jamais de
 * décision lui-même : il permet d'en enregistrer une, prise par un humain.
 */
export function ModaleDecision({ ouverte, eleveNom, onFermer, onConfirmer, chargement }: Props) {
  const [decision, setDecision] = useState('')
  const [erreur, setErreur] = useState('')

  const fermer = () => {
    setDecision('')
    setErreur('')
    onFermer()
  }

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre={`Statuer sur le dossier de ${eleveNom}`}
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton
            chargement={chargement}
            onClick={() => {
              if (decision.trim().length < 5) {
                setErreur('La décision est obligatoire et doit être explicite.')
                return
              }
              onConfirmer(decision.trim())
              setDecision('')
              setErreur('')
            }}
          >
            Enregistrer la décision
          </Bouton>
        </>
      }
    >
      <Alerte ton="info">
        Cette décision est prise conformément au règlement de l'établissement, après examen du dossier par les
        responsables habilités.
      </Alerte>
      <ZoneTexte
        libelle="Décision"
        requis
        rows={3}
        value={decision}
        onChange={(e) => setDecision(e.target.value)}
        erreur={erreur}
        placeholder="Avertissement notifié à la famille, conseil de discipline convoqué le 20 octobre"
      />
    </Modale>
  )
}
