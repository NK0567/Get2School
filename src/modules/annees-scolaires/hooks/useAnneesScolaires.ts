import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AnneeScolaire, Periode } from '../../../socle/modeles/administration'
import {
  chargerAnnee,
  cloturerAnnee,
  creerAnnee,
  deverrouillerPeriode,
  listerAnnees,
  ouvrirAnnee,
  verrouillerPeriode,
} from '../api'
import type { CreationAnnee } from '../api'

const CLE = 'annees-scolaires'

export function useAnneesScolaires() {
  return useQuery({ queryKey: [CLE], queryFn: listerAnnees })
}

export function useAnneeScolaire(id?: string) {
  return useQuery({
    queryKey: [CLE, id],
    queryFn: () => chargerAnnee(id as string),
    enabled: Boolean(id),
  })
}

export function useCreerAnnee() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: CreationAnnee) => creerAnnee(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useOuvrirAnnee() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (annee: AnneeScolaire) => ouvrirAnnee(annee),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useCloturerAnnee() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (annee: AnneeScolaire) => cloturerAnnee(annee),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useBasculerVerrou() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ periode, anneeLabel, motif }: { periode: Periode; anneeLabel: string; motif?: string }) =>
      periode.isLocked
        ? deverrouillerPeriode(periode, anneeLabel, motif ?? '')
        : verrouillerPeriode(periode, anneeLabel),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [CLE] })
      client.invalidateQueries({ queryKey: ['journal-audit'] })
    },
  })
}
