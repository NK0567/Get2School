/**
 * Garde de rôle · PROPRIETAIRE : Boris
 *
 * Chaque lot protege ses propres écrans avec ce composant. Une maquette qui
 * laisse un enseignant ouvrir la caisse est une maquette fausse.
 */
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import type { Role } from '../modeles/communs'
import { useSession } from '../etat/useSession'
import { journaliser } from '../services/journalAudit'

export function ExigeRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const roleActif = useSession((e) => e.roleActif)
  const position = useLocation()

  if (!roleActif || !roles.includes(roleActif)) {
    void journaliser({
      action: 'ACCESS_DENIED',
      entityType: 'Route',
      entityId: position.pathname,
      entityLabel: position.pathname,
    })
    return <Navigate to="/acces-refuse" replace />
  }
  return <>{children}</>
}
