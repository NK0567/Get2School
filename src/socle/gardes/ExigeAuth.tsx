/**
 * Garde d'authentification · PROPRIETAIRE : Boris
 */
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useSession } from '../etat/useSession'

export function ExigeAuth({ children }: { children: ReactNode }) {
  const utilisateur = useSession((e) => e.utilisateur)
  const position = useLocation()

  if (!utilisateur) {
    return <Navigate to="/connexion" state={{ depuis: position.pathname }} replace />
  }
  return <>{children}</>
}
