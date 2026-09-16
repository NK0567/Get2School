import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Evaluation } from '../../../socle/modeles/academique'
import { chargerEvaluation, creerEvaluation, listerEvaluations, publierEvaluation } from '../api'
import type { CreationEvaluation, FiltresEvaluations } from '../api'

const CLE = 'evaluations'

export function useEvaluations(filtres: FiltresEvaluations) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerEvaluations(filtres) })
}

export function useEvaluation(id?: string) {
  return useQuery({
    queryKey: [CLE, id],
    queryFn: () => chargerEvaluation(id as string),
    enabled: Boolean(id),
  })
}

export function useCreerEvaluation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: CreationEvaluation) => creerEvaluation(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function usePublierEvaluation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (evaluation: Evaluation) => publierEvaluation(evaluation),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
