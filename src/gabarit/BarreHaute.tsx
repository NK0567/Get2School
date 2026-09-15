import { useQuery } from '@tanstack/react-query'
import { LogOut, RotateCcw } from 'lucide-react'
import { Link } from 'react-router'
import { api } from '../socle/api/client'
import { reinitialiserBase } from '../socle/simulation/base'
import { useContexteScolaire } from '../socle/etat/useContexteScolaire'
import { useSession } from '../socle/etat/useSession'
import { LIBELLE_ROLE, ROLES } from '../socle/modeles/communs'
import type { Role } from '../socle/modeles/communs'
import type { AnneeScolaire } from '../socle/modeles/administration'
import { initiales } from '../communs'
import { ClocheNotifications } from '../modules/notifications/composants/ClocheNotifications'
import { RaccourciRecherche } from '../modules/recherche/composants/RaccourciRecherche'

export function BarreHaute() {
  const { utilisateur, roleActif, changerRole, deconnecter } = useSession()
  const { anneeId, periodeId, definirAnnee, definirPeriode } = useContexteScolaire()

  const { data: annees } = useQuery({
    queryKey: ['annees-scolaires'],
    queryFn: async () => (await api.get<AnneeScolaire[]>('/school-years')).data,
  })

  const anneeCourante = annees?.find((a) => a.id === anneeId)

  return (
    <header className="border-line bg-surface flex h-[60px] shrink-0 items-center gap-3 border-b px-6">
      <select
        value={anneeId ?? ''}
        onChange={(e) => definirAnnee(e.target.value)}
        className="border-line bg-surface text-ink h-9 rounded-lg border px-2.5 text-[13px]"
        title="Année scolaire"
      >
        {annees?.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label} {a.status === 'CLOSED' ? '(cloturee)' : ''}
          </option>
        ))}
      </select>

      <select
        value={periodeId ?? ''}
        onChange={(e) => definirPeriode(e.target.value)}
        className="border-line bg-surface text-ink h-9 rounded-lg border px-2.5 text-[13px]"
        title="Periode"
      >
        <option value="">Toutes les périodes</option>
        {anneeCourante?.periods.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label} {p.isLocked ? '(verrouillée)' : ''}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-3">
        {/* Outil de demonstration : retire en production. */}
        <select
          value={roleActif ?? ''}
          onChange={(e) => changerRole(e.target.value as Role)}
          className="border-warning/50 bg-warning/5 text-ink h-9 rounded-lg border border-dashed px-2.5 text-[13px]"
          title="Changer de rôle pour tester les permissions"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {LIBELLE_ROLE[r]}
            </option>
          ))}
        </select>

        <RaccourciRecherche />

        <ClocheNotifications />

        <button
          onClick={reinitialiserBase}
          className="text-muted hover:bg-canvas hover:text-ink rounded-lg p-2 transition"
          title="Réinitialiser les données de demonstration"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <Link
          to="/profil"
          className="hover:bg-canvas flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition"
        >
          <div className="bg-primary-50 text-primary flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold">
            {initiales(utilisateur?.firstName, utilisateur?.lastName)}
          </div>
          <div className="text-right text-[13px] leading-tight max-md:hidden">
            <div className="text-ink font-medium">
              {utilisateur?.firstName} {utilisateur?.lastName}
            </div>
            <div className="text-muted text-xs">{roleActif && LIBELLE_ROLE[roleActif]}</div>
          </div>
        </Link>

        <button
          onClick={() => deconnecter()}
          className="text-muted hover:bg-canvas hover:text-ink rounded-lg p-2 transition"
          title="Se deconnecter"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
