import { useQuery } from '@tanstack/react-query'
import { LONGUEUR_MINIMALE, rechercher } from '../api'
import type { TypeResultat } from '../api'

export function useRecherche(terme: string, types: TypeResultat[]) {
  const assezLong = terme.trim().length >= LONGUEUR_MINIMALE

  return useQuery({
    queryKey: ['recherche', terme.trim(), types],
    queryFn: () => rechercher(terme.trim(), types),
    // Interroger le serveur à chaque lettre saturerait la base sur un
    // établissement de plusieurs milliers d'élèves.
    enabled: assezLong,
  })
}
