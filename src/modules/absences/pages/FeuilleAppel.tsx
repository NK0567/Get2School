/**
 * Feuille d'appel · lot C (Fabrice)
 *
 * Seules les exceptions sont saisies : un clic marque un élève absent ou en
 * retard, rien ne se passe pour les autres. C'est le modèle Presence qui
 * l'impose (type: 'ABSENCE' | 'LATE' uniquement, pas de ligne « présent »).
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Clock, UserX } from 'lucide-react'
import { Bouton, Champ, EnteteDePage, Squelette, cn, useToast } from '../../../ui'
import { SelecteurClasse, formaterNomComplet } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Eleve, Inscription } from '../../../socle/modeles/scolarite'
import type { Page } from '../../../socle/modeles/communs'
import { useFaireAppel } from '../hooks/useAbsences'

type StatutLigne = 'PRESENT' | 'ABSENCE' | 'LATE'

interface LigneAppel {
  studentId: string
  enrollmentId: string
  nom: string
  matricule: string
  statut: StatutLigne
  durationMinutes: number
}

const aujourdhui = () => new Date().toISOString().slice(0, 10)

export default function FeuilleAppel() {
  const toast = useToast()
  const faireAppel = useFaireAppel()

  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(aujourdhui())
  const [modifications, setModifications] = useState<Record<string, Partial<LigneAppel>>>({})

  const { data: inscriptions, isLoading: chargeInscriptions } = useQuery({
    queryKey: ['inscriptions', classId],
    queryFn: async () => (await api.get<Inscription[]>('/enrollments', { params: { classId } })).data,
    enabled: Boolean(classId),
  })

  const { data: eleves } = useQuery({
    queryKey: ['eleves', 'appel'],
    queryFn: async () => (await api.get<Page<Eleve>>('/students', { params: { taille: 500 } })).data,
    enabled: Boolean(inscriptions?.length),
  })

  const ligneBase = useMemo<LigneAppel[] | null>(() => {
    if (!inscriptions || !eleves) return null
    return [...inscriptions]
      .sort((a, b) => {
        const ea = eleves.contenu.find((e) => e.id === a.studentId)
        const eb = eleves.contenu.find((e) => e.id === b.studentId)
        return (ea?.lastName ?? '').localeCompare(eb?.lastName ?? '')
      })
      .map((inscription) => {
        const eleve = eleves.contenu.find((e) => e.id === inscription.studentId)
        return {
          studentId: inscription.studentId,
          enrollmentId: inscription.id,
          nom: formaterNomComplet(eleve?.firstName, eleve?.lastName),
          matricule: eleve?.matricule ?? '',
          statut: 'PRESENT' as StatutLigne,
          durationMinutes: 15,
        }
      })
  }, [inscriptions, eleves])

  const lignes = ligneBase?.map((l) => ({ ...l, ...modifications[l.studentId] })) ?? null
  const exceptions = lignes?.filter((l) => l.statut !== 'PRESENT') ?? []

  const majLigne = (studentId: string, modifs: Partial<LigneAppel>) =>
    setModifications((m) => ({ ...m, [studentId]: { ...m[studentId], ...modifs } }))

  const enregistrer = async () => {
    if (!lignes) return
    try {
      await faireAppel.mutateAsync({
        classId,
        date,
        saisies: exceptions.map((l) => ({
          studentId: l.studentId,
          enrollmentId: l.enrollmentId,
          type: l.statut as 'ABSENCE' | 'LATE',
          durationMinutes: l.statut === 'LATE' ? l.durationMinutes : undefined,
        })),
      })
      setModifications({})
      toast('succes', `Appel enregistré : ${exceptions.length} exception(s) sur ${lignes.length} élève(s).`)
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? "L'enregistrement a échoué.")
    }
  }

  return (
    <>
      <EnteteDePage
        titre="Feuille d'appel"
        sousTitre="Seules les absences et les retards sont saisis."
        filAriane={['Académique', 'Absences']}
        actions={
          <Bouton
            disabled={!classId || !lignes?.length}
            chargement={faireAppel.isPending}
            onClick={enregistrer}
          >
            Enregistrer l'appel
          </Bouton>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SelecteurClasse valeur={classId} onChange={setClassId} requis />
        <Champ
          libelle="Date"
          requis
          type="date"
          max={aujourdhui()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {!classId && (
        <p className="border-line bg-canvas text-muted rounded-xl border border-dashed px-4 py-8 text-center text-[13px]">
          Choisissez une classe pour afficher la liste des élèves.
        </p>
      )}

      {classId && chargeInscriptions && <Squelette className="h-64" />}

      {classId && lignes && lignes.length === 0 && (
        <p className="border-line bg-surface text-muted rounded-xl border px-4 py-8 text-center text-[13px]">
          Aucune inscription active dans cette classe.
        </p>
      )}

      {lignes && lignes.length > 0 && (
        <div className="border-line bg-surface overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-line bg-canvas text-muted border-b text-left text-[12px] font-semibold">
                <th className="px-4 py-2.5">Élève</th>
                <th className="px-4 py-2.5">Matricule</th>
                <th className="px-4 py-2.5 text-center">Statut</th>
                <th className="w-32 px-4 py-2.5 text-right">Durée du retard</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr key={ligne.studentId} className="border-line border-b last:border-0">
                  <td className="text-ink px-4 py-2 font-medium">{ligne.nom}</td>
                  <td className="text-muted px-4 py-2 tabular-nums">{ligne.matricule}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => majLigne(ligne.studentId, { statut: 'PRESENT' })}
                        className={cn(
                          'flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] transition',
                          ligne.statut === 'PRESENT'
                            ? 'bg-success/10 text-success font-medium'
                            : 'text-muted hover:bg-canvas',
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Présent
                      </button>
                      <button
                        type="button"
                        onClick={() => majLigne(ligne.studentId, { statut: 'LATE' })}
                        className={cn(
                          'flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] transition',
                          ligne.statut === 'LATE'
                            ? 'bg-warning/10 text-warning font-medium'
                            : 'text-muted hover:bg-canvas',
                        )}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Retard
                      </button>
                      <button
                        type="button"
                        onClick={() => majLigne(ligne.studentId, { statut: 'ABSENCE' })}
                        className={cn(
                          'flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] transition',
                          ligne.statut === 'ABSENCE'
                            ? 'bg-danger/10 text-danger font-medium'
                            : 'text-muted hover:bg-canvas',
                        )}
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Absent
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {ligne.statut === 'LATE' && (
                      <input
                        type="number"
                        min={1}
                        value={ligne.durationMinutes}
                        onChange={(e) =>
                          majLigne(ligne.studentId, { durationMinutes: Number(e.target.value) })
                        }
                        className="border-line bg-surface focus:border-primary focus:ring-primary-50 h-8 w-20 rounded-lg border px-2 text-right text-[13px] tabular-nums outline-none focus:ring-2"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {exceptions.length > 0 && (
        <p className="text-muted mt-3 text-[13px]">
          {exceptions.length} exception(s) sur {lignes?.length} élève(s) :{' '}
          {exceptions.filter((l) => l.statut === 'ABSENCE').length} absence(s),{' '}
          {exceptions.filter((l) => l.statut === 'LATE').length} retard(s).
        </p>
      )}
    </>
  )
}
