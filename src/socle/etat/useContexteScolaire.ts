/**
 * Annee scolaire et periode selectionnees · PROPRIETAIRE : Boris
 *
 * Tous les ecrans des trois lots filtrent sur ces deux valeurs. Ne jamais
 * relire l'annee depuis un composant : passer par ce store.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EtatContexte {
  anneeId: string | null
  periodeId: string | null
  definirAnnee: (id: string) => void
  definirPeriode: (id: string) => void
}

export const useContexteScolaire = create<EtatContexte>()(
  persist(
    (set) => ({
      anneeId: 'an-2026',
      periodeId: 'an-2026-p1',
      definirAnnee: (anneeId) => set({ anneeId, periodeId: null }),
      definirPeriode: (periodeId) => set({ periodeId }),
    }),
    { name: 'g2s_contexte' },
  ),
)
