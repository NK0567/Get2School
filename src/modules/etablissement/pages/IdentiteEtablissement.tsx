import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { QRCodeSVG } from 'qrcode.react'
import { z } from 'zod'
import { Bouton, Champ, EnteteDePage, SqueletteTableau, useToast } from '../../../ui'
import {
  BadgeStatut,
  GrilleInfos,
  LigneInfo,
  emailValide,
  telephoneValide,
  texteRequis,
} from '../../../communs'
import { useEnregistrerIdentite, useEtablissement } from '../hooks/useEtablissement'

const schema = z.object({
  name: texteRequis("Le nom de l'établissement", 3),
  acronym: texteRequis('Le sigle', 2),
  slogan: z.string().optional(),
  address: texteRequis("L'adresse", 3),
  phone: telephoneValide,
  email: emailValide,
  website: z.string().optional(),
})

type Formulaire = z.infer<typeof schema>

export default function IdentiteEtablissement() {
  const toast = useToast()
  const { data: etablissement, isLoading } = useEtablissement()
  const enregistrer = useEnregistrerIdentite()

  const { register, handleSubmit, formState } = useForm<Formulaire>({
    resolver: zodResolver(schema),
    // Les données sont chargees avant le montage du formulaire : voir le garde
    // isLoading plus bas, qui empêche ce composant de rendre un formulaire vide.
    values: {
      name: etablissement?.name ?? '',
      acronym: etablissement?.acronym ?? '',
      slogan: etablissement?.slogan ?? '',
      address: etablissement?.address ?? '',
      phone: etablissement?.phone ?? '',
      email: etablissement?.email ?? '',
      website: etablissement?.website ?? '',
    },
  })

  const envoyer = handleSubmit(async (valeurs) => {
    if (!etablissement) return
    try {
      await enregistrer.mutateAsync({ avant: etablissement, modifs: valeurs })
      toast('succes', "L'identité de l'établissement à été enregistrée.")
    } catch {
      toast('danger', "L'enregistrement à échoué.")
    }
  })

  if (isLoading) return <SqueletteTableau lignes={5} />

  return (
    <>
      <EnteteDePage
        titre="Identité de l'établissement"
        sousTitre="Ces informations apparaissent en en-tête de tous les documents générés."
        filAriane={['Administration', 'Établissement']}
        actions={
          <Bouton chargement={enregistrer.isPending} onClick={envoyer}>
            Enregistrer
          </Bouton>
        }
      />

      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <div className="border-line bg-surface col-span-2 rounded-xl border p-5">
          <h2 className="mb-4 text-base font-semibold">Informations institutionnelles</h2>
          <div className="grid grid-cols-2 gap-4">
            <Champ
              libelle="Nom de l'établissement"
              requis
              className="col-span-2"
              {...register('name')}
              erreur={formState.errors.name?.message}
            />
            <Champ
              libelle="Sigle"
              requis
              aide="Sert à composer les matricules et les références de documents"
              {...register('acronym')}
              erreur={formState.errors.acronym?.message}
            />
            <Champ libelle="Slogan" {...register('slogan')} aide="Facultatif" />
            <Champ
              libelle="Adresse"
              requis
              className="col-span-2"
              {...register('address')}
              erreur={formState.errors.address?.message}
            />
            <Champ
              libelle="Téléphone"
              requis
              {...register('phone')}
              erreur={formState.errors.phone?.message}
            />
            <Champ
              libelle="Adresse électronique"
              requis
              type="email"
              {...register('email')}
              erreur={formState.errors.email?.message}
            />
            <Champ libelle="Site web" className="col-span-2" {...register('website')} aide="Facultatif" />
          </div>
        </div>

        <div className="border-line bg-surface rounded-xl border p-5">
          <h2 className="mb-3 text-base font-semibold">Identité numérique</h2>
          <div className="bg-canvas flex flex-col items-center gap-3 rounded-lg p-4">
            <QRCodeSVG
              value={`${location.origin}/v/${etablissement?.institutionalId ?? ''}`}
              size={128}
              level="M"
            />
            <code className="text-ink text-[13px] font-semibold tracking-wide">
              {etablissement?.institutionalId}
            </code>
          </div>
          <p className="text-muted mt-3 text-xs">
            Cet identifiant est généré à la création de l'établissement et ne peut pas être modifié. Le QR
            code ne contient qu'une adresse de vérification, aucune donnée personnelle.
          </p>
          <div className="border-line mt-4 border-t pt-3">
            <GrilleInfos colonnes={2}>
              <LigneInfo libelle="Code">{etablissement?.code}</LigneInfo>
              <LigneInfo libelle="Statut">
                {etablissement && <BadgeStatut valeur={etablissement.status} />}
              </LigneInfo>
            </GrilleInfos>
          </div>
        </div>
      </div>
    </>
  )
}
