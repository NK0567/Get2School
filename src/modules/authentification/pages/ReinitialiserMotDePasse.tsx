import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleCheck, ShieldX } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Bouton, Champ, Squelette, useToast } from '../../../ui'
import { JaugeMotDePasse, evaluerMotDePasse } from '../../../communs'
import { reinitialiserMotDePasse, verifierJetonReinitialisation } from '../api'
import { CadreAuthentification } from '../composants/CadreAuthentification'

export default function ReinitialiserMotDePasse() {
  const [parametres] = useSearchParams()
  const jeton = parametres.get('jeton') ?? ''
  const naviguer = useNavigate()
  const toast = useToast()

  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  const verification = useQuery({
    queryKey: ['jeton-reinitialisation', jeton],
    queryFn: () => verifierJetonReinitialisation(jeton),
    enabled: Boolean(jeton),
    retry: false,
  })

  const evaluation = evaluerMotDePasse(motDePasse, { email: verification.data?.email })

  const envoyer = async () => {
    if (!evaluation.valide) {
      setErreur('Le mot de passe ne respecte pas encore toutes les exigences.')
      return
    }
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }
    setErreur('')
    setEnCours(true)
    try {
      await reinitialiserMotDePasse(jeton, motDePasse)
      toast('succes', 'Votre mot de passe a été modifié. Connectez-vous.')
      naviguer('/connexion', { replace: true })
    } catch (e) {
      setErreur((e as { message?: string })?.message ?? 'La réinitialisation a échoué.')
    } finally {
      setEnCours(false)
    }
  }

  if (!jeton || (verification.data && !verification.data.valide) || verification.isError) {
    return (
      <CadreAuthentification
        titre="Lien invalide"
        pied={
          <Link to="/mot-de-passe-oublie" className="text-primary hover:underline">
            Demander un nouveau lien
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <ShieldX className="text-danger h-9 w-9" />
          <p className="text-muted text-sm">
            Ce lien est expiré ou a déjà été utilisé. Un lien de réinitialisation est valable trente minutes
            et ne sert qu'une seule fois.
          </p>
        </div>
      </CadreAuthentification>
    )
  }

  if (verification.isLoading) {
    return (
      <CadreAuthentification titre="Vérification du lien">
        <div className="flex flex-col gap-2">
          <Squelette className="h-10" />
          <Squelette className="h-10" />
        </div>
      </CadreAuthentification>
    )
  }

  return (
    <CadreAuthentification
      titre="Nouveau mot de passe"
      sousTitre={`Compte ${verification.data?.email ?? ''}`}
    >
      <div className="flex flex-col gap-4">
        <Champ
          libelle="Nouveau mot de passe"
          requis
          type="password"
          autoComplete="new-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
        <JaugeMotDePasse valeur={motDePasse} contexte={{ email: verification.data?.email }} />
        <Champ
          libelle="Confirmation"
          requis
          type="password"
          autoComplete="new-password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void envoyer()}
          erreur={erreur}
        />
        {motDePasse && confirmation && motDePasse === confirmation && evaluation.valide && (
          <span className="text-success flex items-center gap-1.5 text-xs">
            <CircleCheck className="h-3.5 w-3.5" />
            Les deux saisies correspondent.
          </span>
        )}
        <Bouton chargement={enCours} onClick={envoyer} className="w-full">
          Enregistrer le mot de passe
        </Bouton>
      </div>
    </CadreAuthentification>
  )
}
