import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Alerte, Bouton, Champ } from '../../../ui'
import { useSession } from '../../../socle/etat/useSession'
import { CadreAuthentification } from '../composants/CadreAuthentification'
import { ComptesDemonstration } from '../composants/ComptesDemonstration'

interface EtatNavigation {
  depuis?: string
}

export default function PageConnexion() {
  const naviguer = useNavigate()
  const position = useLocation()
  const connecter = useSession((e) => e.connecter)
  const motifFermeture = useSession((e) => e.motifFermeture)
  const effacerMotif = useSession((e) => e.effacerMotif)

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  const envoyer = async () => {
    if (!email || !motDePasse) {
      setErreur('Renseignez votre adresse et votre mot de passe.')
      return
    }
    setErreur('')
    setEnCours(true)
    try {
      await connecter(email.trim().toLowerCase(), motDePasse)
      effacerMotif()
      const depuis = (position.state as EtatNavigation | null)?.depuis
      naviguer(depuis ?? '/tableau-de-bord', { replace: true })
    } catch (e) {
      // Le message vient du serveur et reste volontairement identique que le
      // compte existe ou non : le formulaire ne doit pas permettre de deviner
      // quelles adresses sont enregistrées dans l'établissement.
      setErreur((e as { message?: string })?.message ?? 'Connexion impossible.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <CadreAuthentification
      titre="Connexion"
      sousTitre="Accédez à votre espace établissement."
      pied={
        <>
          <Link to="/mot-de-passe-oublie" className="text-primary hover:underline">
            Mot de passe oublié
          </Link>
          <span className="text-muted mx-2">·</span>
          <Link to="/inscription-etablissement" className="text-primary hover:underline">
            Inscrire mon établissement
          </Link>
        </>
      }
    >
      {motifFermeture === 'EXPIRATION' && (
        <Alerte ton="alerte" titre="Session expirée">
          Votre session a pris fin. Connectez-vous de nouveau pour continuer.
        </Alerte>
      )}
      {motifFermeture === 'INACTIVITE' && (
        <Alerte ton="alerte" titre="Session fermée pour inactivité">
          Par sécurité, votre session a été fermée après une période sans activité.
        </Alerte>
      )}

      <div className="flex flex-col gap-4">
        <Champ
          libelle="Adresse électronique"
          requis
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Champ
          libelle="Mot de passe"
          requis
          type="password"
          autoComplete="current-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void envoyer()}
          erreur={erreur}
        />
        <Bouton chargement={enCours} onClick={envoyer} className="w-full">
          Se connecter
        </Bouton>
      </div>

      {import.meta.env.DEV && (
        <ComptesDemonstration
          onChoisir={(adresse) => {
            setEmail(adresse)
            setMotDePasse('demonstration')
            setErreur('')
          }}
        />
      )}
    </CadreAuthentification>
  )
}
