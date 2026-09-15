import { useQuery } from '@tanstack/react-query'
import { KeyRound, RotateCcw } from 'lucide-react'
import { api } from '../../../socle/api/client'
import { reinitialiserBase } from '../../../socle/simulation/base'
import { LIBELLE_ROLE } from '../../../socle/modeles/communs'
import type { Utilisateur } from '../../../socle/modeles/administration'

interface Props {
  onChoisir: (email: string) => void
}

/**
 * Aide au développement, affichée UNIQUEMENT tant que l'API est simulée.
 *
 * La simulation vérifie l'adresse contre les comptes du jeu de démonstration,
 * exactement comme le fera le backend. Sans cette liste, il faut connaître par
 * cœur les adresses pour se connecter, ce qui bloque quiconque clone le dépôt.
 *
 * Ce composant disparaît automatiquement en production : il est conditionné à
 * import.meta.env.DEV et le compilateur le retire du bundle de production.
 */
export function ComptesDemonstration({ onChoisir }: Props) {
  const { data } = useQuery({
    queryKey: ['comptes-demonstration'],
    queryFn: async () =>
      (await api.get<{ contenu: Utilisateur[] }>('/users', { params: { taille: 20 } })).data,
    staleTime: Infinity,
  })

  const comptes = (data?.contenu ?? []).filter((u) => u.isActive)
  if (comptes.length === 0) return null

  return (
    <div className="border-warning/40 bg-warning/5 mt-5 rounded-lg border border-dashed p-4">
      <div className="text-warning mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
        <KeyRound className="h-3.5 w-3.5" />
        Comptes de démonstration
      </div>
      <p className="text-muted mb-2.5 text-[11px]">
        L'API est simulée. Choisissez un compte, le mot de passe n'est pas vérifié.
      </p>

      <div className="flex flex-col gap-1">
        {comptes.map((compte) => (
          <button
            key={compte.id}
            type="button"
            onClick={() => onChoisir(compte.email)}
            className="hover:bg-warning/10 flex items-baseline justify-between gap-3 rounded px-2 py-1 text-left text-[12px] transition"
          >
            <span className="text-ink truncate">{compte.email}</span>
            <span className="text-muted shrink-0 text-[11px]">{LIBELLE_ROLE[compte.role]}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={reinitialiserBase}
        className="text-muted hover:text-ink mt-2.5 inline-flex items-center gap-1.5 text-[11px] transition"
        title="Restaure le jeu de données d'origine, y compris les comptes désactivés"
      >
        <RotateCcw className="h-3 w-3" />
        Réinitialiser les données de démonstration
      </button>
    </div>
  )
}
