/**
 * Aperçu d'un bulletin · lot C (Fabrice)
 *
 * Ceci est un aperçu de calcul, pas le document officiel. Le document
 * portant une référence et un QR code (RG-17) se génère depuis le Centre
 * documentaire, qui lit exactement les mêmes données via ce module. Cette
 * distinction est affichée à l'écran pour ne jamais laisser croire qu'un
 * aperçu imprimé ici fait foi.
 */
import { ArrowLeft, FileOutput } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Alerte, Badge, Bouton, Squelette } from '../../../ui'
import { GrilleInfos, LigneInfo, formaterMoyenne, formaterRang } from '../../../communs'
import { useBulletin } from '../hooks/useBulletins'
import { LIBELLE_GRAVITE } from '../../discipline/api'

export default function ApercuBulletin() {
  const { enrollmentId, periodId } = useParams<{ enrollmentId: string; periodId: string }>()
  const requete = useBulletin(enrollmentId, periodId)

  if (requete.isLoading) return <Squelette className="h-96" />
  if (!requete.data) return null

  const donnees = requete.data

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/bulletins"
        className="text-muted hover:text-ink mb-3 inline-flex items-center gap-1.5 text-[13px] transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au classement
      </Link>

      <Alerte ton="info" titre="Aperçu de calcul, pas le document officiel">
        Ces chiffres sont calculés en direct à partir des évaluations publiées. Le bulletin officiel, avec sa
        référence et son QR code de vérification, se génère depuis le Centre documentaire.
      </Alerte>

      <div className="border-line bg-surface rounded-xl border p-6">
        <div className="border-line mb-5 flex items-start justify-between border-b pb-4">
          <div>
            <h1 className="text-ink text-lg font-semibold">{donnees.student.fullName}</h1>
            <p className="text-muted text-[13px]">
              {donnees.student.matricule} · {donnees.classroom.name} · {donnees.period.label}
            </p>
          </div>
          <Bouton
            variante="secondaire"
            icone={<FileOutput className="h-4 w-4" />}
            onClick={() =>
              window.open(`/documents?type=BULLETIN&cible=${enrollmentId}&periode=${periodId}`, '_blank')
            }
          >
            Générer le document officiel
          </Bouton>
        </div>

        <div className="border-line overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-line bg-canvas text-muted border-b text-left text-[12px] font-semibold">
                <th className="px-3 py-2">Matière</th>
                <th className="w-20 px-3 py-2 text-center">Coef.</th>
                <th className="w-28 px-3 py-2 text-right">Moyenne</th>
                <th className="w-28 px-3 py-2 text-right">Moy. classe</th>
                <th className="w-16 px-3 py-2 text-center">Rang</th>
                <th className="px-3 py-2">Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {donnees.subjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted px-3 py-6 text-center text-[13px]">
                    Aucune évaluation publiée pour cette période.
                  </td>
                </tr>
              ) : (
                donnees.subjects.map((matiere) => (
                  <tr key={matiere.subjectId} className="border-line border-b last:border-0">
                    <td className="text-ink px-3 py-2">{matiere.subjectName}</td>
                    <td className="text-muted px-3 py-2 text-center tabular-nums">{matiere.coefficient}</td>
                    <td className="text-ink px-3 py-2 text-right font-medium tabular-nums">
                      {formaterMoyenne(matiere.average)}
                    </td>
                    <td className="text-muted px-3 py-2 text-right tabular-nums">
                      {formaterMoyenne(matiere.classAverage)}
                    </td>
                    <td className="text-muted px-3 py-2 text-center tabular-nums">
                      {formaterRang(matiere.rank)}
                    </td>
                    <td className="text-muted px-3 py-2">{matiere.appreciation}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-line bg-canvas border-t">
                <td colSpan={2} className="text-ink px-3 py-2.5 text-[13px] font-semibold">
                  Moyenne générale
                </td>
                <td className="text-ink px-3 py-2.5 text-right font-semibold tabular-nums">
                  {formaterMoyenne(donnees.general.average)} / 20
                </td>
                <td />
                <td className="text-ink px-3 py-2.5 text-center font-semibold tabular-nums">
                  {formaterRang(donnees.general.rank, donnees.general.total)}
                </td>
                <td className="px-3 py-2.5">
                  <Badge ton={donnees.general.passed ? 'succes' : 'danger'}>
                    {donnees.general.appreciation}
                  </Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="border-line mt-5 border-t pt-4">
          <GrilleInfos colonnes={3}>
            <LigneInfo libelle="Absences">
              {donnees.attendance.absences} ({donnees.attendance.justified} justifiée(s))
            </LigneInfo>
            <LigneInfo libelle="Retards">{donnees.attendance.lateCount}</LigneInfo>
            <LigneInfo libelle="Discipline">
              {donnees.discipline.events === 0
                ? 'Aucun événement'
                : `${donnees.discipline.events} événement(s)${
                    donnees.discipline.highestSeverity
                      ? ` · gravité maximale : ${LIBELLE_GRAVITE[donnees.discipline.highestSeverity as keyof typeof LIBELLE_GRAVITE]}`
                      : ''
                  }`}
            </LigneInfo>
          </GrilleInfos>
        </div>
      </div>
    </div>
  )
}
