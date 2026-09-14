import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Laptop } from 'lucide-react'
import { Badge, Bouton, EtatVide, Squelette, useToast } from '../../../ui'
import { formaterDepuis } from '../../../communs'
import { listerSessions, revoquerSession } from '../api'

export function SessionsActives() {
  const toast = useToast()
  const client = useQueryClient()

  const requete = useQuery({ queryKey: ['sessions'], queryFn: listerSessions })
  const revoquer = useMutation({
    mutationFn: (id: string) => revoquerSession(id),
    onSuccess: () => client.invalidateQueries({ queryKey: ['sessions'] }),
  })

  if (requete.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Squelette className="h-14" />
        <Squelette className="h-14" />
      </div>
    )
  }

  const sessions = requete.data ?? []
  if (sessions.length === 0) {
    return <EtatVide titre="Aucune autre session ouverte" icone={<Laptop className="h-8 w-8" />} />
  }

  return (
    <div className="flex flex-col gap-2">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="border-line flex items-center justify-between rounded-lg border px-4 py-3"
        >
          <div>
            <div className="text-ink flex items-center gap-2 text-sm font-medium">
              {session.appareil}
              {session.courante && <Badge ton="succes">Session actuelle</Badge>}
            </div>
            <div className="text-muted text-xs">
              {session.adresseIp} · activité {formaterDepuis(session.derniereActivite)}
            </div>
          </div>
          {!session.courante && (
            <Bouton
              variante="fantome"
              taille="sm"
              chargement={revoquer.isPending}
              onClick={async () => {
                await revoquer.mutateAsync(session.id)
                toast('succes', 'La session a été fermée.')
              }}
            >
              Fermer
            </Bouton>
          )}
        </div>
      ))}
    </div>
  )
}
