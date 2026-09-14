import { useState } from 'react'
import { MailCheck } from 'lucide-react'
import { Link } from 'react-router'
import { Alerte, Bouton, Champ } from '../../../ui'
import { emailValide } from '../../../communs'
import { demanderReinitialisation } from '../api'
import { CadreAuthentification } from '../composants/CadreAuthentification'

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [envoye, setEnvoye] = useState(false)

  const envoyer = async () => {
    const verification = emailValide.safeParse(email.trim())
    if (!verification.success) {
      setErreur('Adresse électronique invalide.')
      return
    }
    setErreur('')
    setEnCours(true)
    try {
      await demanderReinitialisation(email.trim().toLowerCase())
    } finally {
      setEnCours(false)
      // Confirmation affichée dans tous les cas, y compris si l'adresse est
      // inconnue : révéler l'inverse permettrait d'énumérer les comptes.
      setEnvoye(true)
    }
  }

  if (envoye) {
    return (
      <CadreAuthentification
        titre="Demande enregistrée"
        pied={
          <Link to="/connexion" className="text-primary hover:underline">
            Retour à la connexion
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="text-success h-9 w-9" />
          <p className="text-muted text-sm">
            Si un compte est associé à <span className="text-ink font-medium">{email}</span>, un lien de
            réinitialisation vient d'y être envoyé. Ce lien est valable trente minutes et ne peut servir
            qu'une fois.
          </p>
          <p className="text-muted text-xs">
            Sans message d'ici quelques minutes, vérifiez vos courriers indésirables, puis rapprochez-vous de
            l'administrateur de votre établissement.
          </p>
        </div>
      </CadreAuthentification>
    )
  }

  return (
    <CadreAuthentification
      titre="Mot de passe oublié"
      sousTitre="Indiquez l'adresse de votre compte."
      pied={
        <Link to="/connexion" className="text-primary hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      <div className="flex flex-col gap-4">
        <Champ
          libelle="Adresse électronique"
          requis
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void envoyer()}
          erreur={erreur}
        />
        <Alerte ton="info">
          Seul l'administrateur de votre établissement peut réinitialiser un compte dont l'adresse n'est plus
          accessible.
        </Alerte>
        <Bouton chargement={enCours} onClick={envoyer} className="w-full">
          Envoyer le lien
        </Bouton>
      </div>
    </CadreAuthentification>
  )
}
