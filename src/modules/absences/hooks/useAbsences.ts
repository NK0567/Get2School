import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Presence } from '../../../socle/modeles/academique'
import { faireAppel, justifierAbsence, listerAbsences } from '../api'
import type { FiltresAbsences, SaisieAppel } from '../api'

const CLE = 'absences'

export function useAbsences(filtres: FiltresAbsences) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerAbsences(filtres) })
}

export function useFaireAppel() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, date, saisies }: { classId: string; date: string; saisies: SaisieAppel[] }) =>
      faireAppel(classId, date, saisies),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useJustifierAbsence() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ presence, motif }: { presence: Presence; motif: string }) =>
      justifierAbsence(presence, motif),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
