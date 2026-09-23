import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EvenementDisciplinaire } from '../../../socle/modeles/academique'
import { chargerEvenement, listerEvenements, signalerIncident, statuerSurEvenement } from '../api'
import type { FiltresDiscipline, SignalementIncident } from '../api'

const CLE = 'discipline'

export function useEvenementsDiscipline(filtres: FiltresDiscipline) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerEvenements(filtres) })
}

export function useEvenementDiscipline(id?: string) {
  return useQuery({
    queryKey: [CLE, id],
    queryFn: () => chargerEvenement(id as string),
    enabled: Boolean(id),
  })
}

export function useSignalerIncident() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: SignalementIncident) => signalerIncident(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useStatuerSurEvenement() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ evenement, decision }: { evenement: EvenementDisciplinaire; decision: string }) =>
      statuerSurEvenement(evenement, decision),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
