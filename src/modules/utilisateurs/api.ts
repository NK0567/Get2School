/**
 * Appels API du module Utilisateurs · lot A
 *
 * Règle : un module ne parle jamais à la simulation, il parle à l'API.
 * Aucune donnée en dur ici ni dans les composants.
 */
import { api } from '../../socle/api/client'
import type { Page, Permission, Role } from '../../socle/modeles/communs'
import type { Utilisateur } from '../../socle/modeles/administration'
import { journaliser } from '../../socle/services/journalAudit'

export interface FiltresUtilisateurs {
  recherche?: string
  role?: Role | ''
  actif?: string
  page?: number
  taille?: number
}

export async function listerUtilisateurs(filtres: FiltresUtilisateurs) {
  const { data } = await api.get<Page<Utilisateur>>('/users', { params: filtres })
  return data
}

export interface CreationUtilisateur {
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: Role
  permissions?: Permission[]
}

export async function creerUtilisateur(corps: CreationUtilisateur) {
  const { data } = await api.post<Utilisateur>('/users', corps)
  await journaliser({
    action: 'USER_CREATE',
    entityType: 'Utilisateur',
    entityId: data.id,
    entityLabel: `${data.firstName} ${data.lastName}`,
    after: { email: data.email, role: data.role },
  })
  return data
}

export async function changerStatutUtilisateur(utilisateur: Utilisateur, actif: boolean) {
  const { data } = await api.patch<Utilisateur>(`/users/${utilisateur.id}/status`, { isActive: actif })
  await journaliser({
    action: actif ? 'USER_ACTIVATE' : 'USER_DEACTIVATE',
    entityType: 'Utilisateur',
    entityId: utilisateur.id,
    entityLabel: `${utilisateur.firstName} ${utilisateur.lastName}`,
    before: { isActive: utilisateur.isActive },
    after: { isActive: actif },
  })
  return data
}
