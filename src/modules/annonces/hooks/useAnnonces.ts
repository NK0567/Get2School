import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Annonce } from '../../../socle/modeles/administration'
import { chargerAnnonce, enregistrerBrouillon, listerAnnonces, publierAnnonce, retirerAnnonce } from '../api'
import type { FiltresAnnonces, RedactionAnnonce } from '../api'

const CLE = 'annonces'

export function useAnnonces(filtres: FiltresAnnonces) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerAnnonces(filtres) })
}

export function useAnnonce(id?: string) {
  return useQuery({
    queryKey: [CLE, id],
    queryFn: () => chargerAnnonce(id as string),
    enabled: Boolean(id),
  })
}

export function useEnregistrerBrouillon() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (redaction: RedactionAnnonce) => enregistrerBrouillon(redaction),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function usePublier() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => publierAnnonce(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [CLE] })
      client.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useRetirer() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ annonce, motif }: { annonce: Annonce; motif: string }) => retirerAnnonce(annonce, motif),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
