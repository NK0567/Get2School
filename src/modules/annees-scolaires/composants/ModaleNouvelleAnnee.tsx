import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Alerte, Bouton, Champ, Modale, Selecteur, useToast } from '../../../ui'
import { dateValide } from '../../../communs'
import { useCreerAnnee } from '../hooks/useAnneesScolaires'

const schema = z
  .object({
    label: z.string().regex(/^\d{4}-\d{4}$/, 'Le libelle doit avoir la forme 2026-2027.'),
    startDate: dateValide,
    endDate: dateValide,
    periodType: z.enum(['TRIMESTER', 'SEMESTER']),
  })
  .refine((v) => v.startDate < v.endDate, {
    message: 'La date de fin doit être postérieure à la date de début.',
    path: ['endDate'],
  })

type Formulaire = z.infer<typeof schema>

export function ModaleNouvelleAnnee({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const toast = useToast()
  const creer = useCreerAnnee()

  const { register, handleSubmit, formState, reset, control } = useForm<Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: { label: '', startDate: '', endDate: '', periodType: 'TRIMESTER' },
  })

  // useWatch plutot que watch() : memoisable, donc compatible avec les règles
  // de hooks appliquees au projet.
  const decoupage = useWatch({ control, name: 'periodType' })

  const fermer = () => {
    reset()
    onFermer()
  }

  const envoyer = handleSubmit(async (valeurs) => {
    try {
      await creer.mutateAsync(valeurs)
      toast('succes', "L'année scolaire à été créée en brouillon.")
      fermer()
    } catch (erreur) {
      toast('danger', (erreur as { message?: string })?.message ?? 'La création à échoué.')
    }
  })

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Nouvelle année scolaire"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton chargement={creer.isPending} onClick={envoyer}>
            Creer en brouillon
          </Bouton>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Champ
          libelle="Libelle"
          requis
          placeholder="2027-2028"
          {...register('label')}
          erreur={formState.errors.label?.message}
        />
        <Selecteur
          libelle="Decoupage"
          requis
          {...register('periodType')}
          options={[
            { valeur: 'TRIMESTER', libelle: '3 trimestres' },
            { valeur: 'SEMESTER', libelle: '2 semestres' },
          ]}
        />
        <Champ
          libelle="Debut"
          requis
          type="date"
          {...register('startDate')}
          erreur={formState.errors.startDate?.message}
        />
        <Champ
          libelle="Fin"
          requis
          type="date"
          {...register('endDate')}
          erreur={formState.errors.endDate?.message}
        />
      </div>

      <Alerte ton="alerte">
        L'année sera créée avec {decoupage === 'SEMESTER' ? 'deux semestres' : 'trois trimestres'}. Ce nombre
        est fige a l'ouverture et ne pourra plus changer, car les notes et les bulletins y sont rattaches.
      </Alerte>
    </Modale>
  )
}
