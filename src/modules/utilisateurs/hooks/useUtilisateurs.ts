import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Utilisateur } from '../../../socle/modeles/administration'
import { changerStatutUtilisateur, creerUtilisateur, listerUtilisateurs } from '../api'
import type { CreationUtilisateur, FiltresUtilisateurs } from '../api'

const CLE = 'utilisateurs'

export function useUtilisateurs(filtres: FiltresUtilisateurs) {
  return useQuery({
    queryKey: [CLE, filtres],
    queryFn: () => listerUtilisateurs(filtres),
  })
}

export function useCreerUtilisateur() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (corps: CreationUtilisateur) => creerUtilisateur(corps),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useChangerStatut() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ utilisateur, actif }: { utilisateur: Utilisateur; actif: boolean }) =>
      changerStatutUtilisateur(utilisateur, actif),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}
