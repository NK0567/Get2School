import { Bouton } from './Bouton'
import { Modale } from './Modale'

interface Props {
  ouverte: boolean
  onFermer: () => void
  onConfirmer: () => void
  titre: string
  message: string
  /** Nommer explicitement l'action, jamais « Confirmer ». */
  libelleAction: string
  destructif?: boolean
  chargement?: boolean
}

export function DialogueConfirmation({
  ouverte,
  onFermer,
  onConfirmer,
  titre,
  message,
  libelleAction,
  destructif = true,
  chargement,
}: Props) {
  return (
    <Modale
      ouverte={ouverte}
      onFermer={onFermer}
      titre={titre}
      taille="sm"
      pied={
        <>
          <Bouton variante="secondaire" onClick={onFermer}>
            Annuler
          </Bouton>
          <Bouton variante={destructif ? 'danger' : 'primaire'} chargement={chargement} onClick={onConfirmer}>
            {libelleAction}
          </Bouton>
        </>
      }
    >
      <p className="text-muted text-sm">{message}</p>
    </Modale>
  )
}
