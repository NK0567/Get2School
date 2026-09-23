import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Paiement } from '../../../socle/modeles/finances'
import {
  accorderExoneration,
  annulerPaiement,
  chargerSituation,
  chargerSituationClasse,
  creerFrais,
  enregistrerPaiement,
  listerExonerations,
  listerFrais,
  listerPaiements,
} from '../api'
import type { CreationFrais, FiltresPaiements, SaisiePaiement } from '../api'

export function useFrais() {
  return useQuery({ queryKey: ['frais'], queryFn: listerFrais })
}

export function useCreerFrais() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: CreationFrais) => creerFrais(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: ['frais'] }),
  })
}

export function useExonerations(studentId?: string) {
  return useQuery({
    queryKey: ['exonerations', studentId],
    queryFn: () => listerExonerations(studentId),
  })
}

export function useAccorderExoneration() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      studentId,
      reason,
      feeItemId,
    }: {
      studentId: string
      reason: string
      feeItemId?: string
    }) => accorderExoneration(studentId, reason, feeItemId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['exonerations'] })
      client.invalidateQueries({ queryKey: ['situation-financiere'] })
    },
  })
}

export function usePaiements(filtres: FiltresPaiements) {
  return useQuery({ queryKey: ['paiements', filtres], queryFn: () => listerPaiements(filtres) })
}

export function useEnregistrerPaiement() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: SaisiePaiement) => enregistrerPaiement(corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['paiements'] })
      client.invalidateQueries({ queryKey: ['situation-financiere'] })
    },
  })
}

export function useAnnulerPaiement() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ paiement, motif }: { paiement: Paiement; motif: string }) =>
      annulerPaiement(paiement, motif),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['paiements'] })
      client.invalidateQueries({ queryKey: ['situation-financiere'] })
    },
  })
}

export function useSituation(studentId?: string) {
  return useQuery({
    queryKey: ['situation-financiere', studentId],
    queryFn: () => chargerSituation(studentId as string),
    enabled: Boolean(studentId),
  })
}

export function useSituationClasse(classId: string) {
  return useQuery({
    queryKey: ['situation-financiere', 'classe', classId],
    queryFn: () => chargerSituationClasse(classId),
    enabled: Boolean(classId),
  })
}
