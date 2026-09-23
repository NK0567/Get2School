/**
 * Création d'un élève · lot B (Alida)
 *
 * Le matricule n'est jamais saisi ici : il est généré par le serveur à
 * l'enregistrement (RG-03). L'inscription se crée dans le même geste que le
 * dossier : un élève sans inscription active n'a pas de sens.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { Alerte, Bouton, Champ, EnteteDePage, Selecteur, useToast } from '../../../ui'
import { SelecteurClasse, telephoneFacultatif, telephoneValide, texteRequis } from '../../../communs'
import { useCreerEleve } from '../hooks/useEleves'
import { LIBELLE_RELATION } from '../api'

const schema = z.object({
  firstName: texteRequis('Le prénom'),
  lastName: texteRequis('Le nom'),
  birthDate: z.string().min(1, 'La date de naissance est obligatoire.'),
  birthPlace: texteRequis('Le lieu de naissance'),
  gender: z.enum(['M', 'F']),
  phone: telephoneFacultatif,
  address: z.string().optional(),
  guardianName: texteRequis('Le nom du tuteur'),
  guardianPhone: telephoneValide,
  guardianRelationship: z.enum(['FATHER', 'MOTHER', 'TUTOR', 'OTHER']),
  classId: z.string().min(1, "La classe d'inscription est obligatoire."),
})

type Formulaire = z.infer<typeof schema>

export default function NouvelEleve() {
  const toast = useToast()
  const naviguer = useNavigate()
  const creer = useCreerEleve()

  const { register, handleSubmit, formState, setValue, control } = useForm<Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      birthDate: '',
      birthPlace: '',
      gender: 'M',
      phone: '',
      address: '',
      guardianName: '',
      guardianPhone: '',
      guardianRelationship: 'FATHER',
      classId: '',
    },
  })

  // useWatch plutôt que watch() : memoisable, comme dans ModaleNouvelleAnnee.
  const classId = useWatch({ control, name: 'classId' })

  const envoyer = handleSubmit(async (valeurs) => {
    try {
      const eleve = await creer.mutateAsync(valeurs)
      toast('succes', `${eleve.matricule} a été créé et inscrit.`)
      naviguer(`/eleves/${eleve.id}`)
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La création a échoué.')
    }
  })

  return (
    <div className="mx-auto max-w-3xl">
      <EnteteDePage
        titre="Nouvel élève"
        filAriane={['Scolarité', 'Élèves']}
        actions={
          <Bouton chargement={creer.isPending} onClick={envoyer}>
            Créer et inscrire
          </Bouton>
        }
      />

      <div className="flex flex-col gap-5">
        <div className="border-line bg-surface rounded-xl border p-5">
          <h2 className="mb-4 text-base font-semibold">Identité</h2>
          <div className="grid grid-cols-2 gap-4">
            <Champ
              libelle="Prénom"
              requis
              {...register('firstName')}
              erreur={formState.errors.firstName?.message}
            />
            <Champ
              libelle="Nom"
              requis
              {...register('lastName')}
              erreur={formState.errors.lastName?.message}
            />
            <Champ
              libelle="Date de naissance"
              requis
              type="date"
              {...register('birthDate')}
              erreur={formState.errors.birthDate?.message}
            />
            <Champ
              libelle="Lieu de naissance"
              requis
              {...register('birthPlace')}
              erreur={formState.errors.birthPlace?.message}
            />
            <Selecteur
              libelle="Sexe"
              requis
              {...register('gender')}
              options={[
                { valeur: 'M', libelle: 'Masculin' },
                { valeur: 'F', libelle: 'Féminin' },
              ]}
            />
            <Champ
              libelle="Téléphone"
              {...register('phone')}
              erreur={formState.errors.phone?.message}
              aide="Facultatif"
            />
            <Champ libelle="Adresse" className="col-span-2" {...register('address')} aide="Facultatif" />
          </div>
        </div>

        <div className="border-line bg-surface rounded-xl border p-5">
          <h2 className="mb-4 text-base font-semibold">Tuteur</h2>
          <div className="grid grid-cols-2 gap-4">
            <Champ
              libelle="Nom complet"
              requis
              {...register('guardianName')}
              erreur={formState.errors.guardianName?.message}
            />
            <Selecteur
              libelle="Relation"
              requis
              {...register('guardianRelationship')}
              options={(Object.keys(LIBELLE_RELATION) as (keyof typeof LIBELLE_RELATION)[]).map((r) => ({
                valeur: r,
                libelle: LIBELLE_RELATION[r],
              }))}
            />
            <Champ
              libelle="Téléphone"
              requis
              className="col-span-2"
              {...register('guardianPhone')}
              erreur={formState.errors.guardianPhone?.message}
            />
          </div>
        </div>

        <div className="border-line bg-surface rounded-xl border p-5">
          <h2 className="mb-4 text-base font-semibold">Inscription</h2>
          <SelecteurClasse
            libelle="Classe"
            requis
            valeur={classId}
            onChange={(v) => setValue('classId', v, { shouldValidate: true })}
          />
          {formState.errors.classId && (
            <p className="text-danger mt-1 text-xs">{formState.errors.classId.message}</p>
          )}
        </div>

        <Alerte ton="info">
          Le matricule sera généré automatiquement à la création, selon le format de l'établissement. Il ne
          pourra plus être modifié ensuite.
        </Alerte>
      </div>
    </div>
  )
}
