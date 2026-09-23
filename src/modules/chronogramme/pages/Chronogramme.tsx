/**
 * Chronogramme · lot A (Boris)
 *
 * Vue d'ensemble des activités de l'année, destinée à être composée puis
 * imprimée pour affichage en salle des professeurs ou dans les classes
 * (le document imprimable lui-même passe par le Centre documentaire,
 * comme tout document de la plateforme — voir catalogue.ts, type
 * CHRONOGRAMME).
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { Badge, Bouton, DialogueConfirmation, EnteteDePage, EtatVide, Squelette, useToast } from '../../../ui'
import { formaterDate } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { AnneeScolaire } from '../../../socle/modeles/administration'
import type { EvenementPlanifie } from '../../../socle/modeles/academique'
import { LIBELLE_GENRE } from '../api'
import { useContexteScolaire } from '../../../socle/etat/useContexteScolaire'
import { useEvenements, useSupprimerEvenement } from '../hooks/useChronogramme'
import { ModaleNouvelEvenement } from '../composants/ModaleNouvelEvenement'

const TON_GENRE: Record<EvenementPlanifie['kind'], 'info' | 'alerte' | 'danger' | 'neutre'> = {
  EVALUATION: 'info',
  MEETING: 'neutre',
  ACTIVITY: 'info',
  DEADLINE: 'alerte',
  HOLIDAY: 'danger',
}

export default function Chronogramme() {
  const toast = useToast()
  const anneeId = useContexteScolaire((e) => e.anneeId)
  const [creationOuverte, setCreationOuverte] = useState(false)
  const [aSupprimer, setASupprimer] = useState<EvenementPlanifie | null>(null)

  const requete = useEvenements({})
  const supprimer = useSupprimerEvenement()

  const { data: annees } = useQuery({
    queryKey: ['annees-scolaires'],
    queryFn: async () => (await api.get<AnneeScolaire[]>('/school-years')).data,
  })
  const periodes = annees?.find((a) => a.id === anneeId)?.periods ?? []

  const evenements = requete.data ?? []
  const sansPeriode = evenements
    .filter((e) => !e.periodId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  return (
    <>
      <EnteteDePage
        titre="Chronogramme"
        sousTitre="Les activités de l'année, à composer puis à imprimer pour affichage."
        filAriane={['Administration']}
        actions={
          <Bouton icone={<Plus className="h-4 w-4" />} onClick={() => setCreationOuverte(true)}>
            Nouvel événement
          </Bouton>
        }
      />

      {requete.isLoading && <Squelette className="h-96" />}

      {!requete.isLoading && evenements.length === 0 && (
        <EtatVide
          titre="Aucun événement planifié"
          description="Ajoutez les réunions, activités, échéances et congés de l'année scolaire."
          icone={<CalendarDays className="h-8 w-8" />}
          action={<Bouton onClick={() => setCreationOuverte(true)}>Nouvel événement</Bouton>}
        />
      )}

      {!requete.isLoading && evenements.length > 0 && (
        <div className="flex flex-col gap-6">
          {periodes.map((periode) => {
            const evenementsPeriode = evenements
              .filter((e) => e.periodId === periode.id)
              .sort((a, b) => a.startDate.localeCompare(b.startDate))
            if (evenementsPeriode.length === 0) return null
            return (
              <section key={periode.id}>
                <h2 className="text-ink mb-2 text-sm font-semibold">{periode.label}</h2>
                <div className="border-line divide-line bg-surface flex flex-col divide-y rounded-xl border">
                  {evenementsPeriode.map((e) => (
                    <LigneEvenement key={e.id} evenement={e} onSupprimer={() => setASupprimer(e)} />
                  ))}
                </div>
              </section>
            )
          })}

          {sansPeriode.length > 0 && (
            <section>
              <h2 className="text-ink mb-2 text-sm font-semibold">Toute l'année</h2>
              <div className="border-line divide-line bg-surface flex flex-col divide-y rounded-xl border">
                {sansPeriode.map((e) => (
                  <LigneEvenement key={e.id} evenement={e} onSupprimer={() => setASupprimer(e)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <ModaleNouvelEvenement ouverte={creationOuverte} onFermer={() => setCreationOuverte(false)} />

      <DialogueConfirmation
        ouverte={aSupprimer !== null}
        onFermer={() => setASupprimer(null)}
        titre="Retirer cet événement"
        message="Il sera retiré du chronogramme."
        libelleAction="Retirer"
        chargement={supprimer.isPending}
        onConfirmer={async () => {
          if (!aSupprimer) return
          await supprimer.mutateAsync(aSupprimer.id)
          toast('succes', "L'événement a été retiré.")
          setASupprimer(null)
        }}
      />
    </>
  )
}

function LigneEvenement({
  evenement,
  onSupprimer,
}: {
  evenement: EvenementPlanifie
  onSupprimer: () => void
}) {
  return (
    <div className="group flex items-center justify-between px-4 py-3 text-[13px]">
      <div className="flex items-center gap-3">
        <Badge ton={TON_GENRE[evenement.kind]}>{LIBELLE_GENRE[evenement.kind]}</Badge>
        <div>
          <div className="text-ink font-medium">{evenement.title}</div>
          {evenement.description && <div className="text-muted text-xs">{evenement.description}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted tabular-nums">
          {formaterDate(evenement.startDate)}
          {evenement.endDate &&
            evenement.endDate !== evenement.startDate &&
            ` – ${formaterDate(evenement.endDate)}`}
        </span>
        <button
          onClick={onSupprimer}
          className="text-muted hover:text-danger opacity-0 transition group-hover:opacity-100"
          title="Retirer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
