import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Matiere } from '../../../socle/modeles/scolarite'
import { changerStatutMatiere, creerMatiere, listerMatieres, modifierMatiere } from '../api'
import type { CreationMatiere, ModificationMatiere } from '../api'

const CLE = 'matieres'

export function useMatieres() {
  return useQuery({ queryKey: [CLE], queryFn: listerMatieres })
}

export function useCreerMatiere() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: CreationMatiere) => creerMatiere(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useModifierMatiere() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ matiere, modifs }: { matiere: Matiere; modifs: ModificationMatiere }) =>
      modifierMatiere(matiere, modifs),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useChangerStatutMatiere() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ matiere, actif }: { matiere: Matiere; actif: boolean }) =>
      changerStatutMatiere(matiere, actif),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
