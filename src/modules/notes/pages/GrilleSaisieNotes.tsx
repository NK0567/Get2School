/**
 * Grille de saisie des notes · lot C (Fabrice)
 *
 * L'élève le plus consulté de tout le projet : c'est l'écran qu'un
 * enseignant ouvre chaque semaine. Saisie au clavier, passage à la ligne
 * suivante par Entrée, moyenne de la classe affichée en direct, avertissement
 * si l'utilisateur quitte sans enregistrer.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Ban, Save } from 'lucide-react'
import { useParams } from 'react-router'
import { Alerte, Bouton, EnteteDePage, MenuActions, Squelette, useToast } from '../../../ui'
import type { ActionMenu } from '../../../ui'
import { formaterMoyenne, formaterNomComplet } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { AnneeScolaire } from '../../../socle/modeles/administration'
import type { Eleve, Inscription } from '../../../socle/modeles/scolarite'
import type { Note } from '../../../socle/modeles/academique'
import type { Page } from '../../../socle/modeles/communs'
import { useEvaluation, usePublierEvaluation } from '../../evaluations/hooks/useEvaluations'
import { LIBELLE_TYPE } from '../../evaluations/api'
import { useAnnulerSanction, useEnregistrerNotes, useNotes, useSanctionnerNote } from '../hooks/useNotes'
import { ModaleSanction } from '../composants/ModaleSanction'

type LigneGrille = {
  studentId: string
  enrollmentId: string
  nom: string
  matricule: string
  value: number | null
  status: Note['status']
  noteExistante?: Note
}

export default function GrilleSaisieNotes() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()

  const evaluation = useEvaluation(id)
  const notesExistantes = useNotes(id)
  const publier = usePublierEvaluation()
  const enregistrer = useEnregistrerNotes(id ?? '')
  const sanctionner = useSanctionnerNote(id ?? '')
  const annulerSanction = useAnnulerSanction(id ?? '')

  const { data: inscriptions } = useQuery({
    queryKey: ['inscriptions', evaluation.data?.classId],
    queryFn: async () =>
      (await api.get<Inscription[]>('/enrollments', { params: { classId: evaluation.data?.classId } })).data,
    enabled: Boolean(evaluation.data?.classId),
  })

  const { data: eleves } = useQuery({
    queryKey: ['eleves', 'grille'],
    queryFn: async () => (await api.get<Page<Eleve>>('/students', { params: { taille: 500 } })).data,
    enabled: Boolean(inscriptions?.length),
  })

  const { data: annees } = useQuery({
    queryKey: ['annees-scolaires'],
    queryFn: async () => (await api.get<AnneeScolaire[]>('/school-years')).data,
  })

  // État dérivé : la grille de base vient des données serveur ; les
  // modifications locales, saisies au clavier, sont conservées à part et
  // fusionnées par-dessus. Pas d'effet de synchronisation à maintenir, et
  // aucun risque d'écraser une saisie en cours quand une requête se
  // rafraîchit en arrière-plan.
  const ligneBase = useMemo<LigneGrille[] | null>(() => {
    if (!inscriptions || !eleves || !notesExistantes.data) return null
    const inscritsTries = [...inscriptions].sort((a, b) => {
      const ea = eleves.contenu.find((e) => e.id === a.studentId)
      const eb = eleves.contenu.find((e) => e.id === b.studentId)
      return (ea?.lastName ?? '').localeCompare(eb?.lastName ?? '')
    })
    return inscritsTries.map((inscription) => {
      const eleve = eleves.contenu.find((e) => e.id === inscription.studentId)
      const existante = notesExistantes.data.find((n) => n.studentId === inscription.studentId)
      return {
        studentId: inscription.studentId,
        enrollmentId: inscription.id,
        nom: formaterNomComplet(eleve?.firstName, eleve?.lastName),
        matricule: eleve?.matricule ?? '',
        value: existante?.value ?? null,
        status: existante?.status ?? 'VALID',
        noteExistante: existante,
      }
    })
  }, [inscriptions, eleves, notesExistantes.data])

  const [modifications, setModifications] = useState<Record<string, Partial<LigneGrille>>>({})
  const [aSanctionner, setASanctionner] = useState<LigneGrille | null>(null)
  const refs = useRef<Record<string, HTMLInputElement | null>>({})

  const grille = ligneBase?.map((l) => ({ ...l, ...modifications[l.studentId] })) ?? null
  const modifie = Object.keys(modifications).length > 0

  // Avertit avant de quitter la page si des saisies ne sont pas enregistrées.
  useEffect(() => {
    const avant = (e: BeforeUnloadEvent) => {
      if (modifie) e.preventDefault()
    }
    window.addEventListener('beforeunload', avant)
    return () => window.removeEventListener('beforeunload', avant)
  }, [modifie])

  const periode = annees?.flatMap((a) => a.periods).find((p) => p.id === evaluation.data?.periodId)
  const verrouillee = Boolean(periode?.isLocked) || evaluation.data?.status === 'LOCKED'
  const bareme = evaluation.data?.maxGrade ?? 20

  const moyenneClasse = useMemo(() => {
    if (!grille) return null
    const valides = grille.filter((l) => l.status === 'VALID' && l.value !== null)
    if (valides.length === 0) return null
    return valides.reduce((s, l) => s + (l.value as number), 0) / valides.length
  }, [grille])

  const majLigne = (studentId: string, modifs: Partial<LigneGrille>) => {
    setModifications((m) => ({ ...m, [studentId]: { ...m[studentId], ...modifs } }))
  }

  /** Retire une ligne des modifications en attente : utilisé après une
   * sanction ou son annulation, déjà persistées côté serveur, pour ne pas
   * afficher à tort un avertissement de saisie non enregistrée. */
  const marquerCommeAJour = (studentId: string) => {
    setModifications((m) => {
      const reste = { ...m }
      delete reste[studentId]
      return reste
    })
  }

  const enregistrerLaGrille = async () => {
    if (!grille) return
    try {
      await enregistrer.mutateAsync(
        grille.map((l) => ({
          studentId: l.studentId,
          enrollmentId: l.enrollmentId,
          value: l.status === 'VALID' ? l.value : null,
          status: l.status,
        })),
      )
      setModifications({})
      toast('succes', 'Les notes ont été enregistrées.')
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? "L'enregistrement a échoué.")
    }
  }

  if (evaluation.isLoading || !grille) return <Squelette className="h-96" />
  if (!evaluation.data) return null

  const ev = evaluation.data

  return (
    <>
      <EnteteDePage
        titre={ev.title}
        sousTitre={`${LIBELLE_TYPE[ev.type]} · barème /${ev.maxGrade} · coefficient ×${ev.coefficient}`}
        filAriane={['Académique', 'Évaluations']}
        actions={
          <>
            {ev.status === 'DRAFT' && (
              <Bouton
                variante="secondaire"
                chargement={publier.isPending}
                onClick={async () => {
                  await publier.mutateAsync(ev)
                  toast('succes', "L'évaluation est publiée.")
                }}
              >
                Publier
              </Bouton>
            )}
            <Bouton
              icone={<Save className="h-4 w-4" />}
              disabled={verrouillee || !modifie}
              chargement={enregistrer.isPending}
              onClick={enregistrerLaGrille}
            >
              Enregistrer
            </Bouton>
          </>
        }
      />

      {ev.status === 'DRAFT' && (
        <Alerte ton="info">
          Cette évaluation est en brouillon : les notes saisies n'entrent pas encore dans le calcul des
          moyennes. Publiez-la quand la saisie est terminée.
        </Alerte>
      )}
      {verrouillee && (
        <Alerte ton="alerte" titre="Période verrouillée">
          La saisie est bloquée. Seul le Super Administrateur peut déverrouiller la période, avec motif.
        </Alerte>
      )}

      <div className="border-line bg-surface overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-line bg-canvas text-muted border-b text-left text-[12px] font-semibold">
              <th className="px-4 py-2.5">Élève</th>
              <th className="px-4 py-2.5">Matricule</th>
              <th className="w-28 px-4 py-2.5 text-center">Absent</th>
              <th className="w-32 px-4 py-2.5 text-right">Note / {bareme}</th>
              <th className="w-16 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {grille.map((ligne, index) => {
              const actions: ActionMenu[] = [
                ligne.status === 'PENALIZED'
                  ? {
                      libelle: 'Annuler la sanction',
                      onClick: async () => {
                        if (!ligne.noteExistante) return
                        await annulerSanction.mutateAsync(ligne.noteExistante)
                        marquerCommeAJour(ligne.studentId)
                        toast('succes', 'La sanction a été annulée.')
                      },
                      desactiveeCar: verrouillee ? 'Période verrouillée' : undefined,
                    }
                  : {
                      libelle: 'Sanctionner',
                      icone: <Ban className="h-4 w-4" />,
                      destructif: true,
                      onClick: () => setASanctionner(ligne),
                      desactiveeCar:
                        verrouillee || ev.status !== 'PUBLISHED'
                          ? verrouillee
                            ? 'Période verrouillée'
                            : "Publiez d'abord l'évaluation"
                          : undefined,
                    },
              ]

              return (
                <tr key={ligne.studentId} className="border-line border-b last:border-0">
                  <td className="text-ink px-4 py-2 font-medium">{ligne.nom}</td>
                  <td className="text-muted px-4 py-2 tabular-nums">{ligne.matricule}</td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={ligne.status === 'ABSENT'}
                      disabled={verrouillee}
                      onChange={(e) =>
                        majLigne(ligne.studentId, {
                          status: e.target.checked ? 'ABSENT' : 'VALID',
                          value: e.target.checked ? null : ligne.value,
                        })
                      }
                      className="border-line text-primary h-4 w-4 rounded"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {ligne.status === 'PENALIZED' ? (
                      <span className="text-danger line-through" title={ligne.noteExistante?.penaltyReason}>
                        sanctionnée
                      </span>
                    ) : (
                      <input
                        ref={(el) => {
                          refs.current[ligne.studentId] = el
                        }}
                        type="number"
                        min={0}
                        max={bareme}
                        step={0.25}
                        disabled={verrouillee || ligne.status === 'ABSENT'}
                        value={ligne.value ?? ''}
                        onChange={(e) => {
                          const brut = e.target.value === '' ? null : Number(e.target.value)
                          majLigne(ligne.studentId, { value: brut })
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return
                          const suivante = grille[index + 1]
                          if (suivante) refs.current[suivante.studentId]?.focus()
                        }}
                        className="border-line bg-surface focus:border-primary focus:ring-primary-50 disabled:bg-canvas h-9 w-24 rounded-lg border px-2.5 text-right tabular-nums outline-none focus:ring-2"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <MenuActions actions={actions} />
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-line bg-canvas border-t">
              <td colSpan={3} className="text-muted px-4 py-2.5 text-[13px] font-medium">
                Moyenne de la classe sur cette évaluation
              </td>
              <td className="text-ink px-4 py-2.5 text-right font-semibold tabular-nums">
                {formaterMoyenne(moyenneClasse)} / {bareme}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {modifie && !verrouillee && (
        <p className="text-warning mt-3 flex items-center gap-1.5 text-xs">
          <AlertTriangle className="h-3.5 w-3.5" />
          Des modifications ne sont pas enregistrées.
        </p>
      )}

      <ModaleSanction
        ouverte={aSanctionner !== null}
        eleveNom={aSanctionner?.nom ?? ''}
        onFermer={() => setASanctionner(null)}
        chargement={sanctionner.isPending}
        onConfirmer={async (motif) => {
          const cible = aSanctionner!
          let noteAEnregistrer = cible.noteExistante
          if (!noteAEnregistrer) {
            // La ligne n'a pas encore de note enregistrée en base : on
            // l'enregistre d'abord, la réponse du serveur donne son id.
            const misesAJour = await enregistrer.mutateAsync([
              {
                studentId: cible.studentId,
                enrollmentId: cible.enrollmentId,
                value: cible.value,
                status: 'VALID',
              },
            ])
            noteAEnregistrer = misesAJour.find((n) => n.studentId === cible.studentId)
          }
          if (noteAEnregistrer) {
            await sanctionner.mutateAsync({ note: noteAEnregistrer, motif })
            marquerCommeAJour(cible.studentId)
            toast('alerte', 'La note a été sanctionnée.')
          }
          setASanctionner(null)
        }}
      />
    </>
  )
}
