import type { ReactNode } from 'react'
import { CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { cn } from './cn'

type TonAlerte = 'info' | 'alerte' | 'danger'

const CONFIG = {
  info: { classe: 'border-info/25 bg-info/5 text-info', Icone: Info },
  alerte: { classe: 'border-warning/25 bg-warning/5 text-warning', Icone: TriangleAlert },
  danger: { classe: 'border-danger/25 bg-danger/5 text-danger', Icone: CircleAlert },
}

/**
 * Bandeau d'information EN LIGNE · PROPRIETAIRE : Boris
 *
 * A reserver aux messages qui dependent des donnees affichees : une periode
 * verrouillee, des documents qui expirent, un solde en retard. Un bandeau
 * qui dit toujours la meme chose quelle que soit la donnee n'apporte rien :
 * mettez-le dans la documentation, pas dans l'ecran.
 */
export function Alerte({
  ton = 'info',
  titre,
  children,
}: {
  ton?: TonAlerte
  titre?: string
  children: ReactNode
}) {
  const { classe, Icone } = CONFIG[ton]
  return (
    <div className={cn('mb-4 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5', classe)}>
      <Icone className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="text-[12px] leading-relaxed">
        {titre && <div className="font-semibold">{titre}</div>}
        <div className="text-ink/80">{children}</div>
      </div>
    </div>
  )
}
