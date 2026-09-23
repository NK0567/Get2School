import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Salle } from '../../../socle/modeles/scolarite'
import { changerDisponibiliteSalle, creerSalle, listerSalles, modifierSalle } from '../api'
import type { CreationSalle, ModificationSalle } from '../api'

const CLE = 'salles'

export function useSalles() {
  return useQuery({ queryKey: [CLE], queryFn: listerSalles })
}

export function useCreerSalle() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: CreationSalle) => creerSalle(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useModifierSalle() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ salle, modifs }: { salle: Salle; modifs: ModificationSalle }) =>
      modifierSalle(salle, modifs),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useChangerDisponibiliteSalle() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ salle, disponible }: { salle: Salle; disponible: boolean }) =>
      changerDisponibiliteSalle(salle, disponible),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [CLE] })
      client.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}
