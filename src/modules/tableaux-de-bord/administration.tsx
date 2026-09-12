/**
 * Bloc de tableau de bord des roles d'administration · PROPRIETAIRE : Boris
 * Affiche pour SCHOOL_ADMIN et ADMIN.
 */
import { useQuery } from '@tanstack/react-query'
import { ScrollText } from 'lucide-react'
import { Link } from 'react-router'
import { api } from '../../socle/api/client'
import type { EntreeAudit } from '../../socle/modeles/administration'
import type { Page } from '../../socle/modeles/communs'
import { formaterDepuis } from '../../communs'
import { EtatVide } from '../../ui'

export function TableauDeBordAdministration() {
  const { data } = useQuery({
    queryKey: ['journal-audit', 'recent'],
    queryFn: async () => (await api.get<Page<EntreeAudit>>('/audit-logs', { params: { taille: 8 } })).data,
  })

  return (
    <div className="border-line bg-surface mt-5 rounded-xl border p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Activite recente</h2>
        <Link to="/journal-audit" className="text-primary text-[13px] hover:underline">
          Voir le journal complet
        </Link>
      </div>

      {data && data.contenu.length === 0 ? (
        <EtatVide titre="Aucune operation enregistree" icone={<ScrollText className="h-8 w-8" />} />
      ) : (
        <div className="divide-line divide-y">
          {data?.contenu.map((entree) => (
            <div key={entree.id} className="flex items-center justify-between py-2.5 text-[13px]">
              <div>
                <span className="text-ink font-medium">{entree.userLabel}</span>
                <span className="text-muted"> · {entree.action}</span>
                <div className="text-muted text-xs">{entree.entityLabel}</div>
              </div>
              <span className="text-muted shrink-0 text-xs">{formaterDepuis(entree.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
