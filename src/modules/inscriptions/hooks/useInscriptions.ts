import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Inscription } from '../../../socle/modeles/scolarite'
import { listerInscriptions, reinscrire, transfererVersClasse } from '../api'
import type { FiltresInscriptions } from '../api'

const CLE = 'inscriptions'

export function useInscriptions(filtres: FiltresInscriptions) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerInscriptions(filtres) })
}

export function useReinscrire() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, classId }: { studentId: string; classId: string }) =>
      reinscrire(studentId, classId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [CLE] })
      client.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}

export function useTransfererVersClasse() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ inscription, classIdCible }: { inscription: Inscription; classIdCible: string }) =>
      transfererVersClasse(inscription, classIdCible),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [CLE] })
      client.invalidateQueries({ queryKey: ['classes'] })
    },
  })
}
