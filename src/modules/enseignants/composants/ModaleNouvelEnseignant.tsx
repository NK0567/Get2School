import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Bouton, CaseACocher, Champ, Modale, useToast } from '../../../ui'
import { telephoneValide, texteRequis } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Matiere } from '../../../socle/modeles/scolarite'
import { useCreerEnseignant } from '../hooks/useEnseignants'

const schema = z.object({
  firstName: texteRequis('Le prénom'),
  lastName: texteRequis('Le nom'),
  phone: telephoneValide,
  email: z.union([z.string().email('Adresse électronique invalide.'), z.literal('')]).optional(),
  hireDate: z.string().optional(),
})

type Formulaire = z.infer<typeof schema>

export function ModaleNouvelEnseignant({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const toast = useToast()
  const creer = useCreerEnseignant()
  const [subjectIds, setSubjectIds] = useState<string[]>([])
  const [erreurMatieres, setErreurMatieres] = useState('')

  const { data: matieres } = useQuery({
    queryKey: ['matieres'],
    queryFn: async () => (await api.get<Matiere[]>('/subjects')).data,
  })

  const { register, handleSubmit, formState, reset } = useForm<Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', phone: '', email: '', hireDate: '' },
  })

  const basculerMatiere = (id: string) =>
    setSubjectIds((liste) => (liste.includes(id) ? liste.filter((s) => s !== id) : [...liste, id]))

  const fermer = () => {
    reset()
    setSubjectIds([])
    setErreurMatieres('')
    onFermer()
  }

  const envoyer = handleSubmit(async (valeurs) => {
    if (subjectIds.length === 0) {
      setErreurMatieres('Sélectionnez au moins une matière.')
      return
    }
    try {
      await creer.mutateAsync({ ...valeurs, email: valeurs.email || undefined, subjectIds })
      toast('succes', "L'enseignant a été créé.")
      fermer()
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La création a échoué.')
    }
  })

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Nouvel enseignant"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton chargement={creer.isPending} onClick={envoyer}>
            Créer
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Champ
            libelle="Prénom"
            requis
            {...register('firstName')}
            erreur={formState.errors.firstName?.message}
          />
          <Champ libelle="Nom" requis {...register('lastName')} erreur={formState.errors.lastName?.message} />
          <Champ libelle="Téléphone" requis {...register('phone')} erreur={formState.errors.phone?.message} />
          <Champ
            libelle="Adresse électronique"
            type="email"
            {...register('email')}
            erreur={formState.errors.email?.message}
            aide="Facultatif"
          />
          <Champ libelle="Date d'embauche" type="date" {...register('hireDate')} aide="Facultatif" />
        </div>

        <div>
          <span className="text-ink text-[13px] font-medium">
            Matières enseignées <span className="text-danger">*</span>
          </span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(matieres ?? [])
              .filter((m) => m.isActive)
              .map((matiere) => (
                <CaseACocher
                  key={matiere.id}
                  libelle={matiere.name}
                  checked={subjectIds.includes(matiere.id)}
                  onChange={() => basculerMatiere(matiere.id)}
                />
              ))}
          </div>
          {erreurMatieres && <p className="text-danger mt-1 text-xs">{erreurMatieres}</p>}
        </div>
      </div>
    </Modale>
  )
}
