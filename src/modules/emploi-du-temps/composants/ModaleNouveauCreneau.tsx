import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Bouton, Champ, Modale, Selecteur, useToast } from '../../../ui'
import { SelecteurEnseignant, SelecteurMatiere } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Salle } from '../../../socle/modeles/scolarite'
import { LIBELLE_JOUR } from '../calculs'
import { useCreerCreneau } from '../hooks/useEmploiDuTemps'

const schema = z
  .object({
    subjectId: z.string().min(1, 'La matière est obligatoire.'),
    teacherId: z.string().min(1, "L'enseignant est obligatoire."),
    roomId: z.string().min(1, 'La salle est obligatoire.'),
    dayOfWeek: z.coerce.number().min(1).max(6),
    startTime: z.string().min(1, "L'heure de début est obligatoire."),
    endTime: z.string().min(1, "L'heure de fin est obligatoire."),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: "L'heure de fin doit être après l'heure de début.",
    path: ['endTime'],
  })

type EntreeFormulaire = z.input<typeof schema>
type Formulaire = z.output<typeof schema>

export function ModaleNouveauCreneau({
  ouverte,
  onFermer,
  classId,
}: {
  ouverte: boolean
  onFermer: () => void
  classId: string
}) {
  const toast = useToast()
  const creer = useCreerCreneau()

  const { register, handleSubmit, formState, reset, setValue, control } = useForm<
    EntreeFormulaire,
    unknown,
    Formulaire
  >({
    resolver: zodResolver(schema),
    defaultValues: { subjectId: '', teacherId: '', roomId: '', dayOfWeek: 1, startTime: '', endTime: '' },
  })

  // useWatch plutôt que watch() : memoisable, comme dans les autres modales du projet.
  const subjectId = useWatch({ control, name: 'subjectId' })
  const teacherId = useWatch({ control, name: 'teacherId' })
  const roomId = useWatch({ control, name: 'roomId' })

  const { data: salles } = useQuery({
    queryKey: ['salles'],
    queryFn: async () => (await api.get<Salle[]>('/rooms')).data,
  })

  const fermer = () => {
    reset()
    onFermer()
  }

  const envoyer = handleSubmit(async (valeurs) => {
    try {
      await creer.mutateAsync({ ...valeurs, classId })
      toast('succes', 'Le créneau a été ajouté.')
      fermer()
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La création a échoué.')
    }
  })

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Nouveau créneau"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton chargement={creer.isPending} onClick={envoyer}>
            Ajouter le créneau
          </Bouton>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <SelecteurMatiere
            libelle="Matière"
            requis
            valeur={subjectId}
            onChange={(v) => setValue('subjectId', v, { shouldValidate: true })}
          />
        </div>
        <SelecteurEnseignant
          libelle="Enseignant"
          requis
          valeur={teacherId}
          onChange={(v) => setValue('teacherId', v, { shouldValidate: true })}
        />
        <Selecteur
          libelle="Salle"
          requis
          value={roomId}
          onChange={(e) => setValue('roomId', e.target.value, { shouldValidate: true })}
          placeholder="Choisissez une salle"
          options={(salles ?? [])
            .filter((s) => s.isAvailable)
            .map((s) => ({ valeur: s.id, libelle: s.name }))}
        />
        <Selecteur
          libelle="Jour"
          requis
          {...register('dayOfWeek')}
          options={Object.entries(LIBELLE_JOUR).map(([valeur, libelle]) => ({ valeur, libelle }))}
        />
        <Champ
          libelle="Début"
          requis
          type="time"
          {...register('startTime')}
          erreur={formState.errors.startTime?.message}
        />
        <Champ
          libelle="Fin"
          requis
          type="time"
          {...register('endTime')}
          erreur={formState.errors.endTime?.message}
        />
      </div>
    </Modale>
  )
}
