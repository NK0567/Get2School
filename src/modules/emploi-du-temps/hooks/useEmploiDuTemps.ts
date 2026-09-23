import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { creerCreneau, genererAutomatiquement, listerCreneaux, supprimerCreneau } from '../api'
import type { CreationCreneau, FiltresCreneaux } from '../api'

const CLE = 'creneaux'

export function useCreneaux(filtres: FiltresCreneaux) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerCreneaux(filtres) })
}

export function useCreerCreneau() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: CreationCreneau) => creerCreneau(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useSupprimerCreneau() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => supprimerCreneau(id),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useGenererAutomatiquement() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => genererAutomatiquement(),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
