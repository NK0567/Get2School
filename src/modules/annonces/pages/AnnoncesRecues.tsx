import { useQuery } from '@tanstack/react-query'
import { Megaphone } from 'lucide-react'
import { Badge, EnteteDePage, EtatVide, Squelette, cn } from '../../../ui'
import { formaterDateHeure } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Annonce } from '../../../socle/modeles/administration'
import { LIBELLE_PRIORITE } from '../api'

const TON_PRIORITE: Record<Annonce['priority'], string> = {
  NORMAL: 'border-line',
  HIGH: 'border-warning/40',
  URGENT: 'border-danger/50',
}

/**
 * Consultation des annonces, ouverte à tous les rôles.
 *
 * Distincte de l'écran d'administration : diffuser une annonce est un acte de
 * direction, la lire concerne tout le personnel. Une notification d'annonce
 * renvoie ici, sinon son destinataire tombe sur un refus d'accès.
 */
export default function AnnoncesRecues() {
  const requete = useQuery({
    queryKey: ['annonces-recues'],
    queryFn: async () => (await api.get<Annonce[]>('/announcements/received')).data,
  })

  const annonces = requete.data ?? []

  return (
    <div className="mx-auto max-w-3xl">
      <EnteteDePage
        titre="Annonces"
        sousTitre="Informations diffusées par la direction de votre établissement."
      />

      {requete.isLoading && (
        <div className="flex flex-col gap-2">
          <Squelette className="h-24" />
          <Squelette className="h-24" />
        </div>
      )}

      {!requete.isLoading && annonces.length === 0 && (
        <EtatVide
          titre="Aucune annonce"
          description="Les informations diffusées par la direction apparaîtront ici."
          icone={<Megaphone className="h-8 w-8" />}
        />
      )}

      <div className="flex flex-col gap-3">
        {annonces.map((annonce) => (
          <article
            key={annonce.id}
            className={cn('bg-surface rounded-xl border p-5', TON_PRIORITE[annonce.priority])}
          >
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <h2 className="text-ink text-base font-semibold">{annonce.title}</h2>
              {annonce.priority !== 'NORMAL' && (
                <Badge ton={annonce.priority === 'URGENT' ? 'danger' : 'alerte'}>
                  {LIBELLE_PRIORITE[annonce.priority]}
                </Badge>
              )}
            </div>
            <p className="text-ink/80 text-[13px] leading-relaxed whitespace-pre-line">{annonce.body}</p>
            <div className="text-muted mt-3 text-xs">
              Diffusée le {formaterDateHeure(annonce.publishedAt)}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
