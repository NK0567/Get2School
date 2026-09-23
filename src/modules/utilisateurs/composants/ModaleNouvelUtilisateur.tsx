import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ClipboardCopy } from 'lucide-react'
import { Alerte, Bouton, Champ, Modale, Selecteur, useToast } from '../../../ui'
import { LIBELLE_ROLE, ROLES } from '../../../socle/modeles/communs'
import { useCreerUtilisateur } from '../hooks/useUtilisateurs'

const schema = z.object({
  firstName: z.string().min(2, 'Le prénom est obligatoire.'),
  lastName: z.string().min(2, 'Le nom est obligatoire.'),
  email: z.string().email('Adresse électronique invalide.'),
  phone: z.string().optional(),
  role: z.enum(ROLES, { message: 'Le rôle est obligatoire.' }),
})

type Formulaire = z.infer<typeof schema>

export function ModaleNouvelUtilisateur({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const toast = useToast()
  const creer = useCreerUtilisateur()

  const { register, handleSubmit, formState, reset } = useForm<Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', role: 'SECRETARY' },
  })

  // Une fois le compte créé, on affiche son mot de passe par défaut une
  // seule fois — comme le ferait un courrier électronique dans un vrai
  // backend — plutôt que de le laisser disparaître dans un toast.
  const [cree, setCree] = useState<{ email: string; motDePasse: string } | null>(null)

  const fermer = () => {
    reset()
    setCree(null)
    onFermer()
  }

  const envoyer = handleSubmit(async (valeurs) => {
    try {
      const reponse = await creer.mutateAsync(valeurs)
      setCree({ email: reponse.utilisateur.email, motDePasse: reponse.motDePasseParDefaut })
    } catch (erreur) {
      const message = (erreur as { message?: string })?.message ?? 'La création a échoué.'
      toast('danger', message)
    }
  })

  if (cree) {
    return (
      <Modale
        ouverte={ouverte}
        onFermer={fermer}
        titre="Compte créé"
        pied={<Bouton onClick={fermer}>Terminé</Bouton>}
      >
        <Alerte ton="info" titre="Communiquez ces identifiants à la personne concernée">
          Ce mot de passe ne s'affichera plus jamais : notez-le maintenant. Il devra le changer dès sa
          première connexion.
        </Alerte>
        <div className="border-line bg-canvas mt-4 flex flex-col gap-2 rounded-lg border p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Identifiant</span>
            <code className="font-medium">{cree.email}</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Mot de passe</span>
            <code className="font-medium">{cree.motDePasse}</code>
          </div>
        </div>
        <Bouton
          variante="secondaire"
          className="mt-3 w-full"
          icone={<ClipboardCopy className="h-4 w-4" />}
          onClick={() => {
            navigator.clipboard?.writeText(`Identifiant : ${cree.email}\nMot de passe : ${cree.motDePasse}`)
            toast('succes', 'Copié dans le presse-papiers.')
          }}
        >
          Copier les identifiants
        </Bouton>
      </Modale>
    )
  }

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
          libelle="Prénom"
          requis
          {...register('firstName')}
          erreur={formState.errors.firstName?.message}
        />
        <Champ libelle="Nom" requis {...register('lastName')} erreur={formState.errors.lastName?.message} />
        <Champ
          libelle="Adresse électronique"
          requis
          type="email"
          {...register('email')}
          erreur={formState.errors.email?.message}
          className="col-span-2"
        />
        <Champ libelle="Téléphone" {...register('phone')} aide="Facultatif" />
        <Selecteur
          libelle="Rôle"
          requis
          {...register('role')}
          erreur={formState.errors.role?.message}
          options={ROLES.map((r) => ({ valeur: r, libelle: LIBELLE_ROLE[r] }))}
        />
      </div>
    </Modale>
  )
}
