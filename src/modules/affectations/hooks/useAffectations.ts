import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { creerAffectation, listerAffectations, retirerAffectation } from '../api'
import type { CreationAffectation, FiltresAffectations } from '../api'

const CLE = 'affectations'

export function useAffectations(filtres: FiltresAffectations) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerAffectations(filtres) })
}

export function useCreerAffectation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: CreationAffectation) => creerAffectation(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useRetirerAffectation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => retirerAffectation(id),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
