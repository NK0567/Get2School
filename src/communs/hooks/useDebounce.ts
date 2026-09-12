import { useEffect, useState } from 'react'

/**
 * Retarde la propagation d'une valeur. A utiliser sur tous les champs de
 * recherche : sans cela, chaque frappe declenche un appel API.
 */
export function useDebounce<T>(valeur: T, delai = 350): T {
  const [retardee, setRetardee] = useState(valeur)

  useEffect(() => {
    const minuteur = setTimeout(() => setRetardee(valeur), delai)
    return () => clearTimeout(minuteur)
  }, [valeur, delai])

  return retardee
}
