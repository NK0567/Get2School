import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Bouton, Champ, Modale, Selecteur, useToast } from '../../../ui'
import { texteRequis } from '../../../communs'
import type { Salle } from '../../../socle/modeles/scolarite'
import { LIBELLE_TYPE_SALLE } from '../api'
import { useCreerSalle, useModifierSalle } from '../hooks/useSalles'

const schema = z.object({
  name: texteRequis('Le nom de la salle', 1),
  capacity: z.coerce.number().min(1, 'La capacité doit être supérieure à zéro.'),
  type: z.enum(['CLASSROOM', 'LAB', 'AMPHI', 'WORKSHOP']),
})

type EntreeFormulaire = z.input<typeof schema>
type Formulaire = z.output<typeof schema>

interface Props {
  ouverte: boolean
  onFermer: () => void
  salle?: Salle | null
}

export function ModaleSalle({ ouverte, onFermer, salle }: Props) {
  const toast = useToast()
  const creer = useCreerSalle()
  const modifier = useModifierSalle()
  const enCours = creer.isPending || modifier.isPending

  const { register, handleSubmit, formState, reset } = useForm<EntreeFormulaire, unknown, Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', capacity: 40, type: 'CLASSROOM' },
  })

  useEffect(() => {
    if (ouverte) {
      reset(
        salle
          ? { name: salle.name, capacity: salle.capacity, type: salle.type }
          : { name: '', capacity: 40, type: 'CLASSROOM' },
      )
    }
  }, [ouverte, salle, reset])

  const envoyer = handleSubmit(async (valeurs) => {
    try {
      if (salle) {
        await modifier.mutateAsync({ salle, modifs: { capacity: valeurs.capacity, type: valeurs.type } })
        toast('succes', 'La salle a été mise à jour.')
      } else {
        await creer.mutateAsync(valeurs)
        toast('succes', 'La salle a été créée.')
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
      titre={salle ? `Modifier ${salle.name}` : 'Nouvelle salle'}
      pied={
        <>
          <Bouton variante="secondaire" onClick={onFermer}>
            Annuler
          </Bouton>
          <Bouton chargement={enCours} onClick={envoyer}>
            {salle ? 'Enregistrer' : 'Créer la salle'}
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
          disabled={Boolean(salle)}
          aide={salle ? 'Ne se modifie plus après création' : 'Ex. Salle A1, Laboratoire de physique'}
        />
        <Champ
          libelle="Capacité"
          requis
          type="number"
          min={1}
          {...register('capacity')}
          erreur={formState.errors.capacity?.message}
        />
        <Selecteur
          libelle="Type"
          requis
          {...register('type')}
          options={(Object.keys(LIBELLE_TYPE_SALLE) as (keyof typeof LIBELLE_TYPE_SALLE)[]).map((t) => ({
            valeur: t,
            libelle: LIBELLE_TYPE_SALLE[t],
          }))}
        />
      </div>
    </Modale>
  )
}
