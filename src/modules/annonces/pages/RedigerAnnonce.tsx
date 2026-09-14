import { useState } from 'react'
import { Megaphone, Save, Send } from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  Alerte,
  Bouton,
  Champ,
  DialogueConfirmation,
  EnteteDePage,
  Selecteur,
  ZoneTexte,
  useToast,
} from '../../../ui'
import type { Annonce } from '../../../socle/modeles/administration'
import { LIBELLE_PRIORITE } from '../api'
import { useEnregistrerBrouillon, usePublier } from '../hooks/useAnnonces'
import { SelecteurAudience } from '../composants/SelecteurAudience'

const LIMITE_CORPS = 1000

export default function RedigerAnnonce() {
  const toast = useToast()
  const naviguer = useNavigate()
  const brouillon = useEnregistrerBrouillon()
  const publier = usePublier()

  const [titre, setTitre] = useState('')
  const [corps, setCorps] = useState('')
  const [priorite, setPriorite] = useState<Annonce['priority']>('NORMAL')
  const [audienceType, setAudienceType] = useState<Annonce['audienceType']>('ALL_TEACHERS')
  const [audienceRefs, setAudienceRefs] = useState<string[]>([])
  const [confirmation, setConfirmation] = useState(false)

  const complet =
    titre.trim().length >= 5 &&
    corps.trim().length >= 10 &&
    (audienceType !== 'CLASS' && audienceType !== 'LEVEL' ? true : audienceRefs.length > 0)

  const redaction = {
    title: titre.trim(),
    body: corps.trim(),
    audienceType,
    audienceRefs,
    priority: priorite,
  }

  const enregistrer = async () => {
    try {
      await brouillon.mutateAsync(redaction)
      toast('succes', 'Le brouillon a été enregistré.')
      naviguer('/communication/annonces')
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? "L'enregistrement a échoué.")
    }
  }

  const diffuser = async () => {
    try {
      const annonce = await brouillon.mutateAsync(redaction)
      await publier.mutateAsync(annonce.id)
      toast('succes', "L'annonce a été diffusée.")
      naviguer('/communication/annonces')
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La diffusion a échoué.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <EnteteDePage
        titre="Nouvelle annonce"
        filAriane={['Administration', 'Annonces']}
        actions={
          <>
            <Bouton
              variante="secondaire"
              icone={<Save className="h-4 w-4" />}
              chargement={brouillon.isPending}
              disabled={!complet}
              onClick={enregistrer}
            >
              Enregistrer le brouillon
            </Bouton>
            <Bouton
              icone={<Send className="h-4 w-4" />}
              disabled={!complet}
              onClick={() => setConfirmation(true)}
            >
              Diffuser
            </Bouton>
          </>
        }
      />

      <div className="flex flex-col gap-5">
        <div className="border-line bg-surface rounded-xl border p-5">
          <div className="flex flex-col gap-4">
            <Champ
              libelle="Titre"
              requis
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Conseil de classe du premier trimestre"
              aide="Cinq caractères au minimum"
            />
            <ZoneTexte
              libelle="Message"
              requis
              rows={7}
              maxLength={LIMITE_CORPS}
              value={corps}
              onChange={(e) => setCorps(e.target.value)}
              aide={`${corps.length} / ${LIMITE_CORPS} caractères`}
            />
            <Selecteur
              libelle="Priorité"
              requis
              className="max-w-xs"
              value={priorite}
              onChange={(e) => setPriorite(e.target.value as Annonce['priority'])}
              options={(Object.keys(LIBELLE_PRIORITE) as Annonce['priority'][]).map((p) => ({
                valeur: p,
                libelle: LIBELLE_PRIORITE[p],
              }))}
            />
          </div>
        </div>

        <div className="border-line bg-surface rounded-xl border p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Megaphone className="text-primary h-4 w-4" />
            Diffusion
          </h2>
          <SelecteurAudience
            type={audienceType}
            refs={audienceRefs}
            onChange={(type, refs) => {
              setAudienceType(type)
              setAudienceRefs(refs)
            }}
          />
        </div>

        <Alerte ton="alerte">
          Une annonce diffusée ne peut plus être modifiée : elle a déjà été distribuée à ses destinataires. En
          cas d'erreur, retirez-la et publiez-en une nouvelle.
        </Alerte>
      </div>

      <DialogueConfirmation
        ouverte={confirmation}
        onFermer={() => setConfirmation(false)}
        titre="Diffuser cette annonce"
        destructif={false}
        message="Les destinataires recevront une notification immédiatement. L'annonce ne pourra plus être modifiée."
        libelleAction="Diffuser l'annonce"
        chargement={brouillon.isPending || publier.isPending}
        onConfirmer={async () => {
          setConfirmation(false)
          await diffuser()
        }}
      />
    </div>
  )
}
