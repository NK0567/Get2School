import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Eleve } from '../../../socle/modeles/scolarite'
import { archiverEleve, chargerEleve, creerEleve, listerEleves, modifierEleve } from '../api'
import type { CreationEleve, FiltresEleves, ModificationEleve } from '../api'

const CLE = 'eleves'

export function useEleves(filtres: FiltresEleves) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerEleves(filtres) })
}

export function useEleve(id?: string) {
  return useQuery({
    queryKey: [CLE, id],
    queryFn: () => chargerEleve(id as string),
    enabled: Boolean(id),
  })
}

export function useCreerEleve() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: CreationEleve) => creerEleve(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useModifierEleve() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ eleve, modifs }: { eleve: Eleve; modifs: ModificationEleve }) =>
      modifierEleve(eleve, modifs),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useArchiverEleve() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ eleve, motif }: { eleve: Eleve; motif: string }) => archiverEleve(eleve, motif),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
