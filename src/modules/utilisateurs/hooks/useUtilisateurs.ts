import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Permission, Role } from '../../../socle/modeles/communs'
import type { Utilisateur } from '../../../socle/modeles/administration'
import {
  activiteUtilisateur,
  changerPermissions,
  changerRole,
  changerStatutUtilisateur,
  chargerMatrice,
  chargerUtilisateur,
  creerUtilisateur,
  enregistrerMatrice,
  listerUtilisateurs,
} from '../api'
import type { CreationUtilisateur, FiltresUtilisateurs, MatriceRoles } from '../api'

const CLE = 'utilisateurs'

export function useUtilisateurs(filtres: FiltresUtilisateurs) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerUtilisateurs(filtres) })
}

export function useUtilisateur(id?: string) {
  return useQuery({
    queryKey: [CLE, 'unite', id],
    queryFn: () => chargerUtilisateur(id as string),
    enabled: Boolean(id),
  })
}

export function useActivite(id?: string) {
  return useQuery({
    queryKey: [CLE, 'activite', id],
    queryFn: () => activiteUtilisateur(id as string),
    enabled: Boolean(id),
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

export function useChangerRole() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ utilisateur, role }: { utilisateur: Utilisateur; role: Role }) =>
      changerRole(utilisateur, role),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useChangerPermissions() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ utilisateur, permissions }: { utilisateur: Utilisateur; permissions: Permission[] }) =>
      changerPermissions(utilisateur, permissions),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useMatriceRoles() {
  return useQuery({ queryKey: ['matrice-roles'], queryFn: chargerMatrice })
}

export function useEnregistrerMatrice() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ avant, matrice }: { avant: MatriceRoles; matrice: MatriceRoles }) =>
      enregistrerMatrice(avant, matrice),
    onSuccess: () => client.invalidateQueries({ queryKey: ['matrice-roles'] }),
  })
}
