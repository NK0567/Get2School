import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Bouton, Champ, Modale, Selecteur, useToast } from '../../../ui'
import { texteRequis } from '../../../communs'
import { useCreerClasse } from '../hooks/useClasses'
import { NIVEAUX_CONNUS } from '../api'

const schema = z.object({
  name: texteRequis('Le nom de la classe', 2),
  level: z.string().min(1, 'Le niveau est obligatoire.'),
  series: z.string().optional(),
  capacity: z.coerce.number().min(1, 'La capacité doit être supérieure à zéro.'),
})

type EntreeFormulaire = z.input<typeof schema>
type Formulaire = z.output<typeof schema>

export function ModaleNouvelleClasse({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const toast = useToast()
  const creer = useCreerClasse()

  const { register, handleSubmit, formState, reset } = useForm<EntreeFormulaire, unknown, Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', level: '', series: '', capacity: 60 },
  })

  const fermer = () => {
    reset()
    onFermer()
  }

  const envoyer = handleSubmit(async (valeurs) => {
    try {
      await creer.mutateAsync(valeurs)
      toast('succes', 'La classe a été créée.')
      fermer()
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La création a échoué.')
    }
  })

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Nouvelle classe"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton chargement={creer.isPending} onClick={envoyer}>
            Créer la classe
          </Bouton>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Champ
          libelle="Nom"
          requis
          className="col-span-2"
          {...register('name')}
          erreur={formState.errors.name?.message}
          placeholder="Terminale D2"
        />
        <Selecteur
          libelle="Niveau"
          requis
          {...register('level')}
          erreur={formState.errors.level?.message}
          placeholder="Choisissez un niveau"
          options={NIVEAUX_CONNUS.map((n) => ({ valeur: n, libelle: n }))}
        />
        <Champ libelle="Série" {...register('series')} aide="Facultatif, ex. D, C, A4" />
        <Champ
          libelle="Capacité"
          requis
          type="number"
          min={1}
          className="col-span-2"
          {...register('capacity')}
          erreur={formState.errors.capacity?.message}
        />
      </div>
    </Modale>
  )
}
