import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Bouton, Champ, Modale, Selecteur, ZoneTexte, useToast } from '../../../ui'
import { SelecteurClasse, SelecteurPeriode, texteRequis } from '../../../communs'
import { LIBELLE_GENRE } from '../api'
import { useCreerEvenement } from '../hooks/useChronogramme'

const GENRES = ['MEETING', 'ACTIVITY', 'DEADLINE', 'HOLIDAY'] as const

const schema = z
  .object({
    kind: z.enum(GENRES),
    title: texteRequis('Le titre', 2),
    startDate: z.string().min(1, 'La date de début est obligatoire.'),
    endDate: z.string().optional(),
    periodId: z.string().optional(),
    classId: z.string().optional(),
    description: z.string().optional(),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    message: 'La date de fin doit être après la date de début.',
    path: ['endDate'],
  })

type Formulaire = z.infer<typeof schema>

export function ModaleNouvelEvenement({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const toast = useToast()
  const creer = useCreerEvenement()

  const { register, handleSubmit, formState, reset, setValue, control } = useForm<Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: {
      kind: 'ACTIVITY',
      title: '',
      startDate: '',
      endDate: '',
      periodId: '',
      classId: '',
      description: '',
    },
  })

  const periodId = useWatch({ control, name: 'periodId' })
  const classId = useWatch({ control, name: 'classId' })

  const fermer = () => {
    reset()
    onFermer()
  }

  const envoyer = handleSubmit(async (valeurs) => {
    try {
      await creer.mutateAsync({
        ...valeurs,
        periodId: valeurs.periodId || undefined,
        classId: valeurs.classId || undefined,
        endDate: valeurs.endDate || undefined,
      })
      toast('succes', "L'événement a été ajouté au chronogramme.")
      fermer()
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? "L'ajout a échoué.")
    }
  })

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Nouvel événement"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton chargement={creer.isPending} onClick={envoyer}>
            Ajouter
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Selecteur
            libelle="Genre"
            requis
            {...register('kind')}
            options={GENRES.map((g) => ({ valeur: g, libelle: LIBELLE_GENRE[g] }))}
          />
          <SelecteurPeriode
            libelle="Période"
            valeur={periodId ?? ''}
            onChange={(v) => setValue('periodId', v)}
            placeholder="Toute l'année"
          />
        </div>
        <Champ
          libelle="Titre"
          requis
          {...register('title')}
          erreur={formState.errors.title?.message}
          placeholder="Conseil de classe du 1er trimestre"
        />
        <div className="grid grid-cols-2 gap-4">
          <Champ
            libelle="Date de début"
            requis
            type="date"
            {...register('startDate')}
            erreur={formState.errors.startDate?.message}
          />
          <Champ
            libelle="Date de fin"
            type="date"
            {...register('endDate')}
            erreur={formState.errors.endDate?.message}
            aide="Facultatif, pour un événement sur plusieurs jours"
          />
        </div>
        <SelecteurClasse
          libelle="Classe concernée"
          valeur={classId ?? ''}
          onChange={(v) => setValue('classId', v)}
          placeholder="Tout l'établissement"
        />
        <ZoneTexte libelle="Description" rows={2} {...register('description')} aide="Facultatif" />
      </div>
    </Modale>
  )
}
