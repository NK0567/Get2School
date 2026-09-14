import { useState } from 'react'
import { BellOff, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Bouton, EnteteDePage, EtatVide, Squelette, cn, useToast } from '../../../ui'
import { formaterDepuis } from '../../../communs'
import { TYPES_NOTIFICATION } from '../../../socle/services/notifications'
import type { TypeNotification } from '../../../socle/services/notifications'
import { useMarquerLue, useMarquerToutesLues, useNotifications } from '../hooks/useNotifications'

export default function CentreNotifications() {
  const toast = useToast()
  const naviguer = useNavigate()
  const [nonLuesSeulement, setNonLuesSeulement] = useState(false)

  const requete = useNotifications(nonLuesSeulement ? true : undefined)
  const marquerLue = useMarquerLue()
  const marquerToutes = useMarquerToutesLues()

  const notifications = requete.data ?? []
  const nonLues = notifications.filter((n) => !n.isRead).length

  return (
    <div className="mx-auto max-w-3xl">
      <EnteteDePage
        titre="Notifications"
        sousTitre={nonLues > 0 ? `${nonLues} non lue(s)` : 'Tout est à jour'}
        actions={
          <>
            <Bouton variante="secondaire" onClick={() => setNonLuesSeulement(!nonLuesSeulement)}>
              {nonLuesSeulement ? 'Tout afficher' : 'Non lues seulement'}
            </Bouton>
            <Bouton
              variante="secondaire"
              icone={<CheckCheck className="h-4 w-4" />}
              disabled={nonLues === 0}
              chargement={marquerToutes.isPending}
              onClick={async () => {
                await marquerToutes.mutateAsync()
                toast('succes', 'Toutes les notifications sont marquées comme lues.')
              }}
            >
              Tout marquer comme lu
            </Bouton>
          </>
        }
      />

      {requete.isLoading && (
        <div className="flex flex-col gap-2">
          <Squelette className="h-16" />
          <Squelette className="h-16" />
          <Squelette className="h-16" />
        </div>
      )}

      {!requete.isLoading && notifications.length === 0 && (
        <EtatVide
          titre={nonLuesSeulement ? 'Aucune notification non lue' : 'Aucune notification'}
          description="Les publications, échéances et alertes de votre établissement apparaîtront ici."
          icone={<BellOff className="h-8 w-8" />}
        />
      )}

      <div className="flex flex-col gap-2">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            onClick={async () => {
              if (!notification.isRead) await marquerLue.mutateAsync(notification.id)
              if (notification.linkRoute) naviguer(notification.linkRoute)
            }}
            className={cn(
              'flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition',
              notification.isRead
                ? 'border-line bg-surface hover:bg-canvas'
                : 'border-primary/30 bg-primary-50 hover:bg-primary-50/70',
            )}
          >
            <div
              className={cn(
                'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                notification.isRead ? 'bg-transparent' : 'bg-primary',
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-ink text-sm font-medium">{notification.title}</span>
                <span className="text-muted shrink-0 text-xs">{formaterDepuis(notification.createdAt)}</span>
              </div>
              <p className="text-muted mt-0.5 text-[13px]">{notification.body}</p>
              <span className="text-muted mt-1 inline-block text-[11px] tracking-wide uppercase">
                {TYPES_NOTIFICATION[notification.type as TypeNotification] ?? notification.type}
              </span>
            </div>
          </button>
        ))}
      </div>

      <p className="text-muted mt-5 text-xs">
        Une notification ne contient jamais de note, de montant ni de donnée personnelle. Elle signale qu'une
        information est disponible et renvoie vers l'écran concerné.
      </p>
    </div>
  )
}
