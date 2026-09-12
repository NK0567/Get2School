import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Bouton, Champ, Modale, Selecteur, useToast } from '../../../ui'
import { LIBELLE_ROLE, ROLES } from '../../../socle/modeles/communs'
import { useCreerUtilisateur } from '../hooks/useUtilisateurs'

const schema = z.object({
  firstName: z.string().min(2, 'Le prenom est obligatoire.'),
  lastName: z.string().min(2, 'Le nom est obligatoire.'),
  email: z.string().email('Adresse electronique invalide.'),
  phone: z.string().optional(),
  role: z.enum(ROLES, { message: 'Le role est obligatoire.' }),
})

type Formulaire = z.infer<typeof schema>

export function ModaleNouvelUtilisateur({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const toast = useToast()
  const creer = useCreerUtilisateur()

  const { register, handleSubmit, formState, reset } = useForm<Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', role: 'SECRETARY' },
  })

  const fermer = () => {
    reset()
    onFermer()
  }

  const envoyer = handleSubmit(async (valeurs) => {
    try {
      await creer.mutateAsync(valeurs)
      toast('succes', "L'utilisateur a ete cree.")
      fermer()
    } catch (erreur) {
      const message = (erreur as { message?: string })?.message ?? 'La creation a echoue.'
      toast('danger', message)
    }
  })

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Nouvel utilisateur"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton chargement={creer.isPending} onClick={envoyer}>
            Enregistrer
          </Bouton>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Champ
          libelle="Prenom"
          requis
          {...register('firstName')}
          erreur={formState.errors.firstName?.message}
        />
        <Champ libelle="Nom" requis {...register('lastName')} erreur={formState.errors.lastName?.message} />
        <Champ
          libelle="Adresse electronique"
          requis
          type="email"
          {...register('email')}
          erreur={formState.errors.email?.message}
          className="col-span-2"
        />
        <Champ libelle="Telephone" {...register('phone')} aide="Facultatif" />
        <Selecteur
          libelle="Role"
          requis
          {...register('role')}
          erreur={formState.errors.role?.message}
          options={ROLES.map((r) => ({ valeur: r, libelle: LIBELLE_ROLE[r] }))}
        />
      </div>
    </Modale>
  )
}
