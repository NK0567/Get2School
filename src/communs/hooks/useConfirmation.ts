import { useCallback, useState } from 'react'

/**
 * Evite de recreer un couple d'etats a chaque action destructive.
 *
 *   const suppression = useConfirmation<Eleve>()
 *   ...
 *   <Bouton onClick={() => suppression.demander(eleve)}>Archiver</Bouton>
 *   <DialogueConfirmation
 *     ouverte={suppression.ouverte}
 *     onFermer={suppression.annuler}
 *     onConfirmer={() => { ...; suppression.annuler() }}
 *   />
 */
export function useConfirmation<T>() {
  const [cible, setCible] = useState<T | null>(null)

  const demander = useCallback((valeur: T) => setCible(valeur), [])
  const annuler = useCallback(() => setCible(null), [])

  return { cible, ouverte: cible !== null, demander, annuler }
}
