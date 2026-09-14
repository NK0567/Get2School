/**
 * Session de l'utilisateur connecté · PROPRIÉTAIRE : Boris
 *
 * Le jeton est actuellement conservé dans localStorage. En production, il doit
 * passer dans un cookie HttpOnly, Secure, SameSite=Strict, accompagné d'un
 * jeton de rafraîchissement : un jeton lisible par JavaScript est exposé à
 * toute injection de script. Voir docs/audit-production.md.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '../modeles/communs'
import type { Utilisateur } from '../modeles/administration'
import { api } from '../api/client'

interface EtatSession {
  utilisateur: Utilisateur | null
  /** Rôle effectif : permet de basculer de rôle sans se reconnecter. */
  roleActif: Role | null
  expireLe: string | null
  /** Renseigné quand la session a été fermée par expiration et non par l'utilisateur. */
  motifFermeture: 'EXPIRATION' | 'INACTIVITE' | null

  connecter: (email: string, motDePasse: string) => Promise<void>
  deconnecter: (motif?: 'EXPIRATION' | 'INACTIVITE') => void
  changerRole: (role: Role) => void
  effacerMotif: () => void
}

export const useSession = create<EtatSession>()(
  persist(
    (set) => ({
      utilisateur: null,
      roleActif: null,
      expireLe: null,
      motifFermeture: null,

      connecter: async (email, motDePasse) => {
        const { data } = await api.post('/auth/login', { email, motDePasse })
        localStorage.setItem('g2s_jeton', data.jeton)
        set({
          utilisateur: data.utilisateur,
          roleActif: data.utilisateur.role,
          expireLe: data.expireLe,
          motifFermeture: null,
        })
      },

      deconnecter: (motif) => {
        localStorage.removeItem('g2s_jeton')
        set({ utilisateur: null, roleActif: null, expireLe: null, motifFermeture: motif ?? null })
      },

      changerRole: (role) => set({ roleActif: role }),
      effacerMotif: () => set({ motifFermeture: null }),
    }),
    { name: 'g2s_session' },
  ),
)
