/**
 * Saisie des notes · lot C (Fabrice)
 *
 * File de travail personnelle : contrairement à Évaluations (écran de
 * gestion, filtrable sur n'importe quelle classe), cet écran répond à une
 * seule question pour l'enseignant connecté — qu'est-ce qu'il me reste à
 * faire. Les brouillons à publier et les saisies incomplètes remontent en
 * premier.
 */
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleAlert, CircleCheck, ClipboardList, FileClock } from 'lucide-react'
import { useNavigate } from 'react-router'
import { EnteteDePage, EtatVide, Squelette, cn } from '../../../ui'
import { formaterDate } from '../../../communs'
import type { Evaluation } from '../../../socle/modeles/academique'
import { LIBELLE_TYPE, listerMesEvaluationsANoter } from '../../evaluations/api'

type EvaluationEnrichie = Evaluation & { effectif: number; saisies: number }

function SectionEvaluations({
  titre,
  icone,
  evaluations,
  accent,
  onOuvrir,
}: {
  titre: string
  icone: ReactNode
  evaluations: EvaluationEnrichie[]
  accent?: 'alerte'
  onOuvrir: (id: string) => void
}) {
  if (evaluations.length === 0) return null
  return (
    <div className="mb-6">
      <h2 className="text-muted mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
        {icone}
        {titre}
      </h2>
      <div className="flex flex-col gap-2">
        {evaluations.map((e) => (
          <button
            key={e.id}
            onClick={() => onOuvrir(e.id)}
            className={cn(
              'bg-surface hover:border-primary/40 flex items-center justify-between rounded-lg border px-4 py-3 text-left transition',
              accent === 'alerte' ? 'border-warning/40' : 'border-line',
            )}
          >
            <div>
              <div className="text-ink text-sm font-medium">{e.title}</div>
              <div className="text-muted text-xs">
                {LIBELLE_TYPE[e.type]} · {formaterDate(e.date)}
              </div>
            </div>
            <div className="text-muted text-right text-xs tabular-nums">
              {e.status === 'DRAFT' ? 'Brouillon' : `${e.saisies} / ${e.effectif} noté(s)`}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SaisieNotes() {
  const naviguer = useNavigate()
  const requete = useQuery({
    queryKey: ['evaluations', 'grading-queue'],
    queryFn: listerMesEvaluationsANoter,
  })

  if (requete.isLoading) return <Squelette className="h-96" />

  const toutes = requete.data ?? []
  const brouillons = toutes.filter((e) => e.status === 'DRAFT')
  const incompletes = toutes.filter((e) => e.status === 'PUBLISHED' && e.saisies < e.effectif)
  const completes = toutes.filter(
    (e) => e.status === 'LOCKED' || (e.status === 'PUBLISHED' && e.saisies >= e.effectif),
  )

  if (toutes.length === 0) {
    return (
      <EtatVide
        titre="Aucune évaluation à noter"
        description="Créez une évaluation depuis l'écran Évaluations pour commencer à saisir des notes."
        icone={<ClipboardList className="h-8 w-8" />}
      />
    )
  }

  const ouvrir = (id: string) => naviguer(`/evaluations/${id}/notes`)

  return (
    <>
      <EnteteDePage
        titre="Saisie des notes"
        sousTitre="Vos évaluations, triées par ce qu'il reste à faire."
        filAriane={['Académique']}
      />

      <SectionEvaluations
        titre={`Brouillons à publier (${brouillons.length})`}
        icone={<FileClock className="h-3.5 w-3.5" />}
        evaluations={brouillons}
        accent="alerte"
        onOuvrir={ouvrir}
      />
      <SectionEvaluations
        titre={`Saisie incomplète (${incompletes.length})`}
        icone={<CircleAlert className="h-3.5 w-3.5" />}
        evaluations={incompletes}
        accent="alerte"
        onOuvrir={ouvrir}
      />
      <SectionEvaluations
        titre={`À jour (${completes.length})`}
        icone={<CircleCheck className="h-3.5 w-3.5" />}
        evaluations={completes}
        onOuvrir={ouvrir}
      />
    </>
  )
}
