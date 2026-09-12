import { useCallback, useMemo, useState } from 'react'
import type { EtatTri } from '../../ui'

/**
 * Tri local d'une liste deja chargee. Pour les grandes listes, le tri se fait
 * cote serveur : on passe alors la cle et le sens en parametres de requete.
 */
export function useTri<T>(lignes: T[] | undefined, extracteurs: Record<string, (ligne: T) => unknown>) {
  const [tri, setTri] = useState<EtatTri | undefined>()

  const basculer = useCallback((cle: string) => {
    setTri((actuel) =>
      actuel?.cle === cle ? { cle, sens: actuel.sens === 'asc' ? 'desc' : 'asc' } : { cle, sens: 'asc' },
    )
  }, [])

  const triees = useMemo(() => {
    if (!lignes || !tri) return lignes
    const extraire = extracteurs[tri.cle]
    if (!extraire) return lignes
    const facteur = tri.sens === 'asc' ? 1 : -1
    return [...lignes].sort((a, b) => {
      const va = extraire(a)
      const vb = extraire(b)
      if (va === vb) return 0
      if (va === null || va === undefined) return 1
      if (vb === null || vb === undefined) return -1
      return (va < vb ? -1 : 1) * facteur
    })
  }, [lignes, tri, extracteurs])

  return { tri, basculer, lignes: triees }
}
