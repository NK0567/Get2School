import { useCallback, useState } from 'react'

/**
 * État de pagination commun. Remet la page a zéro des qu'un filtre change :
 * c'est la source d'un bug classique (page 4 d'une liste qui n'en a plus qu'une).
 */
export function usePagination(taille = 10) {
  const [page, setPage] = useState(0)

  const reinitialiser = useCallback(() => setPage(0), [])

  return { page, taille, setPage, reinitialiser }
}
