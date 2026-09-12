/**
 * Garde de role · PROPRIETAIRE : Boris
 *
 * Chaque lot protege ses propres ecrans avec ce composant. Une maquette qui
 * laisse un enseignant ouvrir la caisse est une maquette fausse.
 */
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Role } from '../modeles/communs'
import { useSession } from '../etat/useSession'
import { journaliser } from '../services/journalAudit'

export function ExigeRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const roleActif = useSession((e) => e.roleActif)

  if (!roleActif || !roles.includes(roleActif)) {
    void journaliser({
      action: 'ACCESS_DENIED',
      entityType: 'Route',
      entityId: location.pathname,
      entityLabel: location.pathname,
    })
    return <Navigate to="/tableau-de-bord" replace />
  }
  return <>{children}</>
}
