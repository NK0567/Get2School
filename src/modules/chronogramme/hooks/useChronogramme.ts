import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { creerEvenement, listerEvenements, supprimerEvenement } from '../api'
import type { CreationEvenement, FiltresChronogramme } from '../api'

const CLE = 'evenements-planifies'

export function useEvenements(filtres: FiltresChronogramme) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerEvenements(filtres) })
}

export function useCreerEvenement() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: CreationEvenement) => creerEvenement(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useSupprimerEvenement() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => supprimerEvenement(id),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
