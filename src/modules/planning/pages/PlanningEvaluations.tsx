/**
 * Planning des évaluations · lot C (Fabrice)
 *
 * Signale les semaines chargées pour une classe, tous enseignants confondus.
 * C'est un outil de coordination, pas un verrou : contrairement au
 * verrouillage de période (RG-08), une semaine « en surcharge » reste
 * modifiable. Rien n'empêche techniquement une quatrième évaluation, le rôle
 * de cet écran est de le rendre visible avant que ça n'arrive.
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, TriangleAlert } from 'lucide-react'
import { Alerte, Badge, EnteteDePage, EtatVide, Squelette, cn } from '../../../ui'
import { SelecteurClasse, SelecteurPeriode, formaterDate } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Matiere } from '../../../socle/modeles/scolarite'
import { LIBELLE_TYPE } from '../../evaluations/api'
import { cleSemaine, SEUIL_SURCHARGE_HEBDOMADAIRE } from '../api'
import { usePlanningClasse } from '../hooks/usePlanning'

export default function PlanningEvaluations() {
  const [classId, setClassId] = useState('')
  const [periode, setPeriode] = useState('')

  const requete = usePlanningClasse(classId, periode)
  const { data: matieres } = useQuery({
    queryKey: ['matieres'],
    queryFn: async () => (await api.get<Matiere[]>('/subjects')).data,
  })
  const nomMatiere = (subjectId: string) => matieres?.find((m) => m.id === subjectId)?.name ?? subjectId

  const donnees = requete.data

  const semaines = useMemo(() => {
    if (!donnees) return []
    const groupes = new Map<string, typeof donnees>()
    for (const evaluation of [...donnees].sort((a, b) => a.date.localeCompare(b.date))) {
      const cle = cleSemaine(evaluation.date)
      groupes.set(cle, [...(groupes.get(cle) ?? []), evaluation])
    }
    return [...groupes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cle, evaluations]) => ({
        cle,
        evaluations,
        surcharge: evaluations.length > SEUIL_SURCHARGE_HEBDOMADAIRE,
      }))
  }, [donnees])

  const nombreSemainesSurchargees = semaines.filter((s) => s.surcharge).length

  return (
    <>
      <EnteteDePage
        titre="Planning des évaluations"
        sousTitre="Toutes matières confondues, pour repérer les semaines chargées avant de programmer une nouvelle évaluation."
        filAriane={['Académique']}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SelecteurClasse valeur={classId} onChange={setClassId} requis />
        <SelecteurPeriode valeur={periode} onChange={setPeriode} />
      </div>

      {!classId && (
        <EtatVide
          titre="Choisissez une classe"
          description="Le planning affiche les évaluations programmées par tous les enseignants de la classe."
          icone={<CalendarClock className="h-8 w-8" />}
        />
      )}

      {classId && requete.isLoading && <Squelette className="h-64" />}

      {classId && requete.data && requete.data.length === 0 && (
        <EtatVide
          titre="Aucune évaluation programmée"
          description="Les évaluations créées par les enseignants de cette classe apparaîtront ici, classées par semaine."
          icone={<CalendarClock className="h-8 w-8" />}
        />
      )}

      {nombreSemainesSurchargees > 0 && (
        <Alerte ton="alerte" titre={`${nombreSemainesSurchargees} semaine(s) chargée(s)`}>
          Plus de {SEUIL_SURCHARGE_HEBDOMADAIRE} évaluations la même semaine pour cette classe. Ce n'est pas
          bloquant : c'est un repère pour coordonner les dates avec les autres enseignants avant de programmer
          une évaluation supplémentaire.
        </Alerte>
      )}

      {classId && semaines.length > 0 && (
        <div className="flex flex-col gap-4">
          {semaines.map((semaine) => (
            <div
              key={semaine.cle}
              className={cn(
                'bg-surface rounded-xl border p-4',
                semaine.surcharge ? 'border-warning/40' : 'border-line',
              )}
            >
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-ink text-[13px] font-semibold">Semaine {semaine.cle}</span>
                {semaine.surcharge && (
                  <Badge ton="alerte">
                    <span className="inline-flex items-center gap-1">
                      <TriangleAlert className="h-3 w-3" />
                      {semaine.evaluations.length} évaluations
                    </span>
                  </Badge>
                )}
              </div>
              <div className="divide-line flex flex-col divide-y">
                {semaine.evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="flex items-center justify-between py-2 text-[13px]">
                    <div>
                      <span className="text-ink font-medium">{evaluation.title}</span>
                      <span className="text-muted"> · {nomMatiere(evaluation.subjectId)}</span>
                    </div>
                    <div className="text-muted flex items-center gap-3">
                      <span>{LIBELLE_TYPE[evaluation.type]}</span>
                      <span className="tabular-nums">{formaterDate(evaluation.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
