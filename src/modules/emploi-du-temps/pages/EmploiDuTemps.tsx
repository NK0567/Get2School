/**
 * Emploi du temps · lot B (Alida)
 *
 * Grille hebdomadaire d'une classe. Contrairement au Planning des
 * évaluations (avertissement non bloquant), un conflit ici est un
 * impossible physique : la création est refusée côté serveur, jamais
 * seulement grisée dans l'écran.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, Plus, Trash2, Wand2 } from 'lucide-react'
import { Bouton, DialogueConfirmation, EnteteDePage, EtatVide, Squelette, useToast } from '../../../ui'
import { SelecteurClasse, formaterNomComplet } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { CreneauEmploiDuTemps, Enseignant, Matiere, Salle } from '../../../socle/modeles/scolarite'
import { LIBELLE_JOUR } from '../calculs'
import type { ResultatGenerationAutomatique } from '../api'
import { useCreneaux, useGenererAutomatiquement, useSupprimerCreneau } from '../hooks/useEmploiDuTemps'
import { ModaleNouveauCreneau } from '../composants/ModaleNouveauCreneau'
import { ModaleRapportGeneration } from '../composants/ModaleRapportGeneration'

const JOURS = [1, 2, 3, 4, 5, 6]

export default function EmploiDuTemps() {
  const toast = useToast()
  const [classId, setClassId] = useState('')
  const [creationOuverte, setCreationOuverte] = useState(false)
  const [aSupprimer, setASupprimer] = useState<CreneauEmploiDuTemps | null>(null)
  const [confirmationGenerationOuverte, setConfirmationGenerationOuverte] = useState(false)
  const [rapport, setRapport] = useState<ResultatGenerationAutomatique | null>(null)

  const requete = useCreneaux({ classId })
  const supprimer = useSupprimerCreneau()
  const generer = useGenererAutomatiquement()

  const { data: matieres } = useQuery({
    queryKey: ['matieres'],
    queryFn: async () => (await api.get<Matiere[]>('/subjects')).data,
  })
  const { data: enseignants } = useQuery({
    queryKey: ['enseignants'],
    queryFn: async () => (await api.get<Enseignant[]>('/teachers')).data,
  })
  const { data: salles } = useQuery({
    queryKey: ['salles'],
    queryFn: async () => (await api.get<Salle[]>('/rooms')).data,
  })

  const nomMatiere = (id: string) => matieres?.find((m) => m.id === id)?.name ?? id
  const nomEnseignant = (id: string) => {
    const e = enseignants?.find((x) => x.id === id)
    return e ? formaterNomComplet(e.firstName, e.lastName) : id
  }
  const nomSalle = (id: string) => salles?.find((s) => s.id === id)?.name ?? id

  const creneauxParJour = (jour: number) =>
    (requete.data ?? [])
      .filter((c) => c.dayOfWeek === jour)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <>
      <EnteteDePage
        titre="Emploi du temps"
        sousTitre="Une classe à la fois. Un créneau en conflit est refusé, jamais seulement signalé."
        filAriane={['Scolarité']}
        actions={
          <>
            <Bouton
              variante="secondaire"
              icone={<Wand2 className="h-4 w-4" />}
              onClick={() => setConfirmationGenerationOuverte(true)}
            >
              Générer automatiquement
            </Bouton>
            <Bouton
              icone={<Plus className="h-4 w-4" />}
              disabled={!classId}
              onClick={() => setCreationOuverte(true)}
            >
              Ajouter un créneau
            </Bouton>
          </>
        }
      />

      <div className="mb-4">
        <SelecteurClasse valeur={classId} onChange={setClassId} requis />
      </div>

      {!classId && (
        <EtatVide
          titre="Choisissez une classe"
          description="La grille affiche les créneaux de la classe sélectionnée, jour par jour."
          icone={<CalendarClock className="h-8 w-8" />}
        />
      )}

      {classId && requete.isLoading && <Squelette className="h-96" />}

      {classId && requete.data && (
        <div className="grid grid-cols-6 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {JOURS.map((jour) => (
            <div key={jour} className="border-line bg-surface rounded-xl border p-3">
              <h2 className="text-muted mb-2 text-[12px] font-semibold tracking-wide uppercase">
                {LIBELLE_JOUR[jour]}
              </h2>
              <div className="flex flex-col gap-2">
                {creneauxParJour(jour).length === 0 && (
                  <p className="text-muted py-4 text-center text-xs">—</p>
                )}
                {creneauxParJour(jour).map((creneau) => (
                  <div
                    key={creneau.id}
                    className="group border-line bg-canvas relative rounded-lg border px-2.5 py-2 text-[12px]"
                  >
                    <div className="text-ink font-medium">
                      {creneau.startTime} – {creneau.endTime}
                    </div>
                    <div className="text-muted">{nomMatiere(creneau.subjectId)}</div>
                    <div className="text-muted">{nomEnseignant(creneau.teacherId)}</div>
                    <div className="text-muted">{nomSalle(creneau.roomId)}</div>
                    <button
                      onClick={() => setASupprimer(creneau)}
                      className="absolute top-1.5 right-1.5 opacity-0 transition group-hover:opacity-100"
                      title="Retirer ce créneau"
                    >
                      <Trash2 className="text-muted hover:text-danger h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ModaleNouveauCreneau
        ouverte={creationOuverte}
        onFermer={() => setCreationOuverte(false)}
        classId={classId}
      />

      <DialogueConfirmation
        ouverte={aSupprimer !== null}
        onFermer={() => setASupprimer(null)}
        titre="Retirer ce créneau"
        message="Ce créneau sera retiré de l'emploi du temps de la classe."
        libelleAction="Retirer"
        chargement={supprimer.isPending}
        onConfirmer={async () => {
          if (!aSupprimer) return
          await supprimer.mutateAsync(aSupprimer.id)
          toast('succes', 'Le créneau a été retiré.')
          setASupprimer(null)
        }}
      />
      <DialogueConfirmation
        ouverte={confirmationGenerationOuverte}
        onFermer={() => setConfirmationGenerationOuverte(false)}
        titre="Générer l'emploi du temps automatiquement"
        message="Un créneau sera posé pour chaque affectation (enseignant, matière, classe) qui n'en a pas encore, sur toute l'établissement. Les créneaux déjà existants ne sont jamais touchés."
        libelleAction="Générer"
        chargement={generer.isPending}
        onConfirmer={async () => {
          const resultat = await generer.mutateAsync()
          setConfirmationGenerationOuverte(false)
          setRapport(resultat)
        }}
      />

      <ModaleRapportGeneration resultat={rapport} onFermer={() => setRapport(null)} />
    </>
  )
}
