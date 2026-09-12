import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Bouton, Champ } from '../../../ui'
import { useSession } from '../../../socle/etat/useSession'

export default function PageConnexion() {
  const naviguer = useNavigate()
  const connecter = useSession((e) => e.connecter)
  const [email, setEmail] = useState('direction@lyceebafoussam.cm')
  const [motDePasse, setMotDePasse] = useState('demo')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  const envoyer = async () => {
    setErreur('')
    setEnCours(true)
    try {
      await connecter(email, motDePasse)
      naviguer('/tableau-de-bord', { replace: true })
    } catch {
      setErreur('Adresse electronique ou mot de passe incorrect.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="bg-canvas flex min-h-screen items-center justify-center px-4">
      <div className="border-line bg-surface w-full max-w-sm rounded-xl border p-7">
        <div className="text-ink mb-1 text-2xl font-semibold">Get2School</div>
        <p className="text-muted mb-6 text-sm">Connectez-vous a votre espace etablissement.</p>

        <div className="flex flex-col gap-4">
          <Champ
            libelle="Adresse electronique"
            requis
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Champ
            libelle="Mot de passe"
            requis
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void envoyer()}
            erreur={erreur}
          />
          <Bouton chargement={enCours} onClick={envoyer} className="w-full">
            Se connecter
          </Bouton>
        </div>
      </div>
    </div>
  )
}
