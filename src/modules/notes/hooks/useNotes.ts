import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Note } from '../../../socle/modeles/academique'
import { annulerSanction, enregistrerNotes, listerNotes, sanctionnerNote } from '../api'
import type { SaisieNote } from '../api'

export function useNotes(evaluationId?: string) {
  return useQuery({
    queryKey: ['notes', evaluationId],
    queryFn: () => listerNotes(evaluationId as string),
    enabled: Boolean(evaluationId),
  })
}

export function useEnregistrerNotes(evaluationId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (saisies: SaisieNote[]) => enregistrerNotes(evaluationId, saisies),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notes', evaluationId] }),
  })
}

export function useSanctionnerNote(evaluationId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ note, motif }: { note: Note; motif: string }) => sanctionnerNote(note, motif),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notes', evaluationId] }),
  })
}

export function useAnnulerSanction(evaluationId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (note: Note) => annulerSanction(note),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notes', evaluationId] }),
  })
}
