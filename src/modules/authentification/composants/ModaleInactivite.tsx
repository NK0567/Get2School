import { Bouton, Modale } from '../../../ui'

interface Props {
  secondesRestantes: number | null
  onProlonger: () => void
  onFermerSession: () => void
}

/**
 * Prévient avant de fermer la session plutôt que de faire disparaître un
 * formulaire en cours de saisie sans explication.
 */
export function ModaleInactivite({ secondesRestantes, onProlonger, onFermerSession }: Props) {
  return (
    <Modale
      ouverte={secondesRestantes !== null}
      onFermer={onProlonger}
      titre="Votre session va se fermer"
      taille="sm"
      pied={
        <>
          <Bouton variante="secondaire" onClick={onFermerSession}>
            Se déconnecter
          </Bouton>
          <Bouton onClick={onProlonger}>Rester connecté</Bouton>
        </>
      }
    >
      <p className="text-muted text-sm">
        Aucune activité n'a été détectée depuis plusieurs minutes. Par sécurité, votre session sera fermée
        dans <span className="text-ink font-semibold tabular-nums">{secondesRestantes} secondes</span>.
      </p>
      <p className="text-muted mt-2 text-xs">Les saisies non enregistrées seront perdues.</p>
    </Modale>
  )
}
