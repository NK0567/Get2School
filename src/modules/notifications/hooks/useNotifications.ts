import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { compterNonLues, listerNotifications, marquerLue, marquerToutesLues } from '../api'

const CLE = 'notifications'

export function useNotifications(nonLues?: boolean) {
  return useQuery({ queryKey: [CLE, nonLues], queryFn: () => listerNotifications(nonLues) })
}

/**
 * Compteur de la barre haute. Rafraîchi périodiquement : en production, une
 * connexion temps réel remplace ce sondage, mais le contrat de l'API ne
 * change pas.
 */
export function useCompteurNonLues() {
  return useQuery({
    queryKey: [CLE, 'compteur'],
    queryFn: compterNonLues,
    refetchInterval: 60_000,
  })
}

export function useMarquerLue() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => marquerLue(id),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useMarquerToutesLues() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: marquerToutesLues,
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
