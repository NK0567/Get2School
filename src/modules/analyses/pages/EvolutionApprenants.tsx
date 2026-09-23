/**
 * Évolution des apprenants · lot C (Fabrice)
 *
 * Parcours prévu au cadrage : liste des classes → sélection d'une classe →
 * courbe d'évolution. La comparaison à un élève est un ajout facultatif sur
 * la même courbe, pas un second écran.
 */
import { useState } from 'react'
import { LineChart } from 'lucide-react'
import { EnteteDePage, EtatVide, Selecteur, Squelette } from '../../../ui'
import { GraphiqueLignes, SelecteurClasse, formaterMoyenne, formaterPourcentage } from '../../../communs'
import { useEvolutionClasse } from '../hooks/useAnalyses'

export default function EvolutionApprenants() {
  const [classId, setClassId] = useState('')
  const [enrollmentId, setEnrollmentId] = useState('')

  const requete = useEvolutionClasse(classId, enrollmentId)
  const eleveChoisi = requete.data?.eleves.find((e) => e.enrollmentId === enrollmentId)

  const donneesGraphique =
    requete.data?.points.map((p) => ({
      periode: p.periodLabel,
      classe: p.classAverage,
      eleve: p.studentAverage,
    })) ?? []

  return (
    <>
      <EnteteDePage
        titre="Évolution des apprenants"
        sousTitre="Moyenne de la classe par période, avec comparaison possible à un élève."
        filAriane={['Académique', 'Analyses']}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SelecteurClasse
          valeur={classId}
          onChange={(v) => {
            setClassId(v)
            setEnrollmentId('')
          }}
          requis
        />
        {classId && (
          <Selecteur
            value={enrollmentId}
            onChange={(e) => setEnrollmentId(e.target.value)}
            placeholder="Comparer à un élève (facultatif)"
            options={(requete.data?.eleves ?? []).map((e) => ({
              valeur: e.enrollmentId,
              libelle: `${e.matricule} · ${e.fullName}`,
            }))}
          />
        )}
      </div>

      {!classId && (
        <EtatVide
          titre="Choisissez une classe"
          description="La courbe affiche la moyenne générale de la classe sur les périodes de l'année scolaire en cours."
          icone={<LineChart className="h-8 w-8" />}
        />
      )}

      {classId && requete.isLoading && <Squelette className="h-80" />}

      {classId && requete.data && requete.data.points.every((p) => p.classAverage === null) && (
        <EtatVide
          titre="Aucune évaluation publiée"
          description="La courbe s'affichera dès qu'une évaluation sera publiée sur au moins une période."
          icone={<LineChart className="h-8 w-8" />}
        />
      )}

      {classId && requete.data && requete.data.points.some((p) => p.classAverage !== null) && (
        <div className="flex flex-col gap-5">
          <div className="border-line bg-surface rounded-xl border p-5">
            <GraphiqueLignes
              donnees={donneesGraphique}
              axeX="periode"
              domaineY={[0, 20]}
              reference={{ valeur: 10, libelle: 'Moyenne de passage' }}
              series={[
                { cle: 'classe', libelle: 'Moyenne de la classe' },
                ...(eleveChoisi ? [{ cle: 'eleve', libelle: eleveChoisi.fullName }] : []),
              ]}
            />
          </div>

          <div className="border-line bg-surface overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-line bg-canvas text-muted border-b text-left text-[12px] font-semibold">
                  <th className="px-4 py-2.5">Période</th>
                  <th className="px-4 py-2.5 text-right">Moyenne de classe</th>
                  <th className="px-4 py-2.5 text-right">Taux de réussite</th>
                  {eleveChoisi && <th className="px-4 py-2.5 text-right">{eleveChoisi.fullName}</th>}
                </tr>
              </thead>
              <tbody>
                {requete.data.points.map((point) => (
                  <tr key={point.periodId} className="border-line border-b last:border-0">
                    <td className="text-ink px-4 py-2 font-medium">{point.periodLabel}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formaterMoyenne(point.classAverage)} / 20
                    </td>
                    <td className="text-muted px-4 py-2 text-right tabular-nums">
                      {formaterPourcentage(point.passRate)}
                    </td>
                    {eleveChoisi && (
                      <td className="text-ink px-4 py-2 text-right font-medium tabular-nums">
                        {formaterMoyenne(point.studentAverage)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
