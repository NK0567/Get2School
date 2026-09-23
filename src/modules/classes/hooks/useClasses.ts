import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Classe } from '../../../socle/modeles/scolarite'
import { chargerClasse, creerClasse, listerClasses, modifierClasse } from '../api'
import type { CreationClasse, FiltresClasses, ModificationClasse } from '../api'

const CLE = 'classes'

export function useClasses(filtres: FiltresClasses) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerClasses(filtres) })
}

export function useClasse(id?: string) {
  return useQuery({
    queryKey: [CLE, id],
    queryFn: () => chargerClasse(id as string),
    enabled: Boolean(id),
  })
}

export function useCreerClasse() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: CreationClasse) => creerClasse(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useModifierClasse() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ classe, modifs }: { classe: Classe; modifs: ModificationClasse }) =>
      modifierClasse(classe, modifs),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
