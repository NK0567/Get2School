/**
 * Appels API du module Utilisateurs · lot A (Boris)
 *
 * Règle : un module ne parle jamais à la simulation, il parle à l'API.
 * Aucune donnée en dur ici ni dans les composants.
 */
import { api } from '../../socle/api/client'
import type { Page, Permission, Role } from '../../socle/modeles/communs'
import type { EntreeAudit, Utilisateur } from '../../socle/modeles/administration'
import { journaliser } from '../../socle/services/journalAudit'
import { LIBELLE_ROLE } from '../../socle/modeles/communs'

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

export async function chargerUtilisateur(id: string) {
  const { data } = await api.get<Utilisateur>(`/users/${id}`)
  return data
}

/** Activité récente d'un compte, extraite du journal d'audit. */
export async function activiteUtilisateur(id: string) {
  const { data } = await api.get<Page<EntreeAudit>>('/audit-logs', {
    params: { userId: id, taille: 15 },
  })
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
  const { data } = await api.patch<Utilisateur>(`/users/${utilisateur.id}/status`, {
    isActive: actif,
  })
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

export async function changerRole(utilisateur: Utilisateur, role: Role) {
  const { data } = await api.patch<Utilisateur>(`/users/${utilisateur.id}/role`, { role })
  await journaliser({
    action: 'USER_ROLE_CHANGE',
    entityType: 'Utilisateur',
    entityId: utilisateur.id,
    entityLabel: `${utilisateur.firstName} ${utilisateur.lastName}`,
    before: { role: LIBELLE_ROLE[utilisateur.role] },
    after: { role: LIBELLE_ROLE[role] },
  })
  return data
}

export async function changerPermissions(utilisateur: Utilisateur, permissions: Permission[]) {
  const { data } = await api.put<Utilisateur>(`/users/${utilisateur.id}/permissions`, {
    permissions,
  })
  await journaliser({
    action: 'PERMISSION_CHANGE',
    entityType: 'Utilisateur',
    entityId: utilisateur.id,
    entityLabel: `${utilisateur.firstName} ${utilisateur.lastName}`,
    before: { permissions: utilisateur.permissions },
    after: { permissions },
  })
  return data
}

/* ── Matrice rôles × permissions ────────────────────────── */

export type MatriceRoles = Record<string, Permission[]>

export async function chargerMatrice() {
  const { data } = await api.get<MatriceRoles>('/roles/permissions')
  return data
}

export async function enregistrerMatrice(avant: MatriceRoles, matrice: MatriceRoles) {
  const { data } = await api.put<MatriceRoles>('/roles/permissions', matrice)
  await journaliser({
    action: 'PERMISSION_CHANGE',
    entityType: 'MatriceRoles',
    entityId: 'matrice',
    entityLabel: 'Matrice des rôles et permissions',
    before: avant,
    after: matrice,
  })
  return data
}
