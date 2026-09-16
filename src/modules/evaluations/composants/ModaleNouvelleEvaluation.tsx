import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Bouton, Champ, Modale, Selecteur, useToast } from '../../../ui'
import { SelecteurClasse, SelecteurMatiere, SelecteurPeriode } from '../../../communs'
import { useCreerEvaluation } from '../hooks/useEvaluations'
import { LIBELLE_TYPE } from '../api'

const schema = z.object({
  classId: z.string().min(1, 'La classe est obligatoire.'),
  subjectId: z.string().min(1, 'La matière est obligatoire.'),
  periodId: z.string().min(1, 'La période est obligatoire.'),
  title: z.string().min(3, "L'intitulé est trop court."),
  type: z.enum(['QUIZ', 'HOMEWORK', 'COMPOSITION', 'EXAM', 'TEST', 'PRACTICAL']),
  date: z.string().min(1, 'La date est obligatoire.'),
  maxGrade: z.coerce.number().min(1, 'Le barème doit être supérieur à zéro.'),
  coefficient: z.coerce.number().min(0.5, 'Le coefficient doit être au moins de 0,5.'),
})

type EntreeFormulaire = z.input<typeof schema>
type Formulaire = z.output<typeof schema>

export function ModaleNouvelleEvaluation({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const toast = useToast()
  const creer = useCreerEvaluation()

  const { register, handleSubmit, formState, reset, setValue, control } = useForm<
    EntreeFormulaire,
    unknown,
    Formulaire
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      classId: '',
      subjectId: '',
      periodId: '',
      title: '',
      type: 'QUIZ',
      date: '',
      maxGrade: 20,
      coefficient: 1,
    },
  })

  // useWatch plutôt que watch() : memoisable, comme dans ModaleNouvelleAnnee.
  const classId = useWatch({ control, name: 'classId' })
  const subjectId = useWatch({ control, name: 'subjectId' })
  const periodId = useWatch({ control, name: 'periodId' })

  const fermer = () => {
    reset()
    onFermer()
  }

  const envoyer = handleSubmit(async (valeurs) => {
    try {
      await creer.mutateAsync(valeurs)
      toast('succes', "L'évaluation a été créée en brouillon.")
      fermer()
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La création a échoué.')
    }
  })

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Nouvelle évaluation"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton chargement={creer.isPending} onClick={envoyer}>
            Créer en brouillon
          </Bouton>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Champ
          libelle="Intitulé"
          requis
          className="col-span-2"
          {...register('title')}
          erreur={formState.errors.title?.message}
          placeholder="Interrogation 1 · Suites numériques"
        />
        <SelecteurClasse
          libelle="Classe"
          requis
          valeur={classId}
          onChange={(v) => setValue('classId', v, { shouldValidate: true })}
        />
        <SelecteurMatiere
          libelle="Matière"
          requis
          valeur={subjectId}
          onChange={(v) => setValue('subjectId', v, { shouldValidate: true })}
        />
        <SelecteurPeriode
          libelle="Période"
          requis
          valeur={periodId}
          onChange={(v) => setValue('periodId', v, { shouldValidate: true })}
        />
        <Selecteur
          libelle="Type"
          requis
          {...register('type')}
          options={(Object.keys(LIBELLE_TYPE) as (keyof typeof LIBELLE_TYPE)[]).map((t) => ({
            valeur: t,
            libelle: LIBELLE_TYPE[t],
          }))}
        />
        <Champ
          libelle="Date"
          requis
          type="date"
          {...register('date')}
          erreur={formState.errors.date?.message}
        />
        <Champ
          libelle="Barème"
          requis
          type="number"
          min={1}
          {...register('maxGrade')}
          erreur={formState.errors.maxGrade?.message}
          aide="Note maximale de cette évaluation"
        />
        <Champ
          libelle="Coefficient"
          requis
          type="number"
          min={0.5}
          step={0.5}
          {...register('coefficient')}
          erreur={formState.errors.coefficient?.message}
          aide="Pondère cette évaluation au sein de la matière"
        />
      </div>
    </Modale>
  )
}
