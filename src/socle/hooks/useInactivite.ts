import { useEffect, useRef, useState } from 'react'

interface Options {
  /** Durée d'inactivité avant fermeture, en minutes. */
  minutes: number
  /** Délai d'avertissement avant la fermeture, en secondes. */
  avertissementSecondes: number
  onExpiration: () => void
}

/**
 * Ferme la session après une période sans activité · PROPRIÉTAIRE : Boris
 *
 * Un poste de secrétariat ou de comptabilité reste souvent ouvert dans un
 * bureau de passage. Laisser une session active indéfiniment reviendrait à
 * laisser le dossier des élèves et la caisse accessibles à quiconque passe.
 *
 * Le compte à rebours est purement client : il améliore l'ergonomie. La
 * validité réelle du jeton est contrôlée par le serveur à chaque requête.
 */
export function useInactivite({ minutes, avertissementSecondes, onExpiration }: Options) {
  const [secondesRestantes, setSecondesRestantes] = useState<number | null>(null)
  // Initialisées dans l'effet : ni appel impur ni écriture de référence
  // pendant le rendu, conformément aux règles des hooks.
  const derniereActivite = useRef(0)
  const rappel = useRef(onExpiration)

  useEffect(() => {
    rappel.current = onExpiration
  }, [onExpiration])

  useEffect(() => {
    derniereActivite.current = Date.now()

    const reinitialiser = () => {
      derniereActivite.current = Date.now()
      setSecondesRestantes(null)
    }

    const evenements = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const
    evenements.forEach((e) => window.addEventListener(e, reinitialiser, { passive: true }))

    const minuteur = setInterval(() => {
      const ecoulees = (Date.now() - derniereActivite.current) / 1000
      const limite = minutes * 60
      const restantes = Math.ceil(limite - ecoulees)

      if (restantes <= 0) {
        rappel.current()
        derniereActivite.current = Date.now()
        setSecondesRestantes(null)
      } else if (restantes <= avertissementSecondes) {
        setSecondesRestantes(restantes)
      }
    }, 1000)

    return () => {
      evenements.forEach((e) => window.removeEventListener(e, reinitialiser))
      clearInterval(minuteur)
    }
  }, [minutes, avertissementSecondes])

  const prolonger = () => {
    derniereActivite.current = Date.now()
    setSecondesRestantes(null)
  }

  return { secondesRestantes, prolonger }
}
