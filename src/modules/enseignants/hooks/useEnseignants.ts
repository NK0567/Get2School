import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Enseignant } from '../../../socle/modeles/scolarite'
import {
  changerStatutEnseignant,
  chargerEnseignant,
  creerEnseignant,
  listerEnseignants,
  modifierEnseignant,
} from '../api'
import type { CreationEnseignant, FiltresEnseignants, ModificationEnseignant } from '../api'

const CLE = 'enseignants'

export function useEnseignants(filtres: FiltresEnseignants) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerEnseignants(filtres) })
}

export function useEnseignant(id?: string) {
  return useQuery({
    queryKey: [CLE, id],
    queryFn: () => chargerEnseignant(id as string),
    enabled: Boolean(id),
  })
}

export function useCreerEnseignant() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: CreationEnseignant) => creerEnseignant(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useModifierEnseignant() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ enseignant, modifs }: { enseignant: Enseignant; modifs: ModificationEnseignant }) =>
      modifierEnseignant(enseignant, modifs),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useChangerStatutEnseignant() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ enseignant, actif }: { enseignant: Enseignant; actif: boolean }) =>
      changerStatutEnseignant(enseignant, actif),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
