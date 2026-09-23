import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alerte, Bouton, Champ, Modale, useToast } from '../../../ui'
import { texteRequis } from '../../../communs'
import type { Matiere } from '../../../socle/modeles/scolarite'
import { useCreerMatiere, useModifierMatiere } from '../hooks/useMatieres'

const schema = z.object({
  name: texteRequis('Le nom de la matière', 2),
  code: texteRequis('Le code', 1).max(6, 'Six caractères au maximum.'),
  coefficient: z.coerce.number().min(0.5, 'Le coefficient doit être au moins de 0,5.'),
  maxGrade: z.coerce.number().min(1, 'Le barème doit être supérieur à zéro.'),
})

type EntreeFormulaire = z.input<typeof schema>
type Formulaire = z.output<typeof schema>

interface Props {
  ouverte: boolean
  onFermer: () => void
  /** Présente : modification. Absente : création. */
  matiere?: Matiere | null
}

export function ModaleMatiere({ ouverte, onFermer, matiere }: Props) {
  const toast = useToast()
  const creer = useCreerMatiere()
  const modifier = useModifierMatiere()
  const enCours = creer.isPending || modifier.isPending

  const { register, handleSubmit, formState, reset } = useForm<EntreeFormulaire, unknown, Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', code: '', coefficient: 1, maxGrade: 20 },
  })

  useEffect(() => {
    if (ouverte) {
      reset(
        matiere
          ? {
              name: matiere.name,
              code: matiere.code,
              coefficient: matiere.coefficient,
              maxGrade: matiere.maxGrade,
            }
          : { name: '', code: '', coefficient: 1, maxGrade: 20 },
      )
    }
  }, [ouverte, matiere, reset])

  const envoyer = handleSubmit(async (valeurs) => {
    try {
      if (matiere) {
        await modifier.mutateAsync({
          matiere,
          modifs: { name: valeurs.name, coefficient: valeurs.coefficient, maxGrade: valeurs.maxGrade },
        })
        toast('succes', 'La matière a été mise à jour.')
      } else {
        await creer.mutateAsync(valeurs)
        toast('succes', 'La matière a été créée.')
      }
      onFermer()
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? "L'enregistrement a échoué.")
    }
  })

  return (
    <Modale
      ouverte={ouverte}
      onFermer={onFermer}
      titre={matiere ? `Modifier ${matiere.name}` : 'Nouvelle matière'}
      pied={
        <>
          <Bouton variante="secondaire" onClick={onFermer}>
            Annuler
          </Bouton>
          <Bouton chargement={enCours} onClick={envoyer}>
            {matiere ? 'Enregistrer' : 'Créer la matière'}
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
        />
        <Champ
          libelle="Code"
          requis
          {...register('code')}
          erreur={formState.errors.code?.message}
          disabled={Boolean(matiere)}
          aide={matiere ? 'Ne se modifie plus après création' : 'Ex. MATH, PC, FR'}
        />
        <Champ
          libelle="Barème par défaut"
          requis
          type="number"
          min={1}
          {...register('maxGrade')}
          erreur={formState.errors.maxGrade?.message}
        />
        <Champ
          libelle="Coefficient"
          requis
          type="number"
          min={0.5}
          step={0.5}
          className="col-span-2"
          {...register('coefficient')}
          erreur={formState.errors.coefficient?.message}
        />
      </div>

      {matiere && (
        <Alerte ton="alerte">
          Modifier le coefficient change le poids de cette matière dans la moyenne générale de tous les
          élèves, y compris pour les périodes déjà calculées. Ce n'est pas bloqué, mais c'est une décision qui
          affecte des résultats déjà établis.
        </Alerte>
      )}
    </Modale>
  )
}
