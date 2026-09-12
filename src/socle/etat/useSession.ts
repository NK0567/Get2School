/**
 * Session de l'utilisateur connecte · PROPRIETAIRE : Boris
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '../modeles/communs'
import type { Utilisateur } from '../modeles/administration'
import { api } from '../api/client'

interface EtatSession {
  utilisateur: Utilisateur | null
  /** Role effectif : permet de basculer de role en demonstration sans se reconnecter. */
  roleActif: Role | null
  connecter: (email: string, motDePasse: string) => Promise<void>
  deconnecter: () => void
  changerRole: (role: Role) => void
}

export const useSession = create<EtatSession>()(
  persist(
    (set) => ({
      utilisateur: null,
      roleActif: null,

      connecter: async (email, motDePasse) => {
        const { data } = await api.post('/auth/login', { email, motDePasse })
        localStorage.setItem('g2s_jeton', data.jeton)
        set({ utilisateur: data.utilisateur, roleActif: data.utilisateur.role })
      },

      deconnecter: () => {
        localStorage.removeItem('g2s_jeton')
        set({ utilisateur: null, roleActif: null })
      },

      changerRole: (role) => set({ roleActif: role }),
    }),
    { name: 'g2s_session' },
  ),
)
