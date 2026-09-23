import { Outlet } from 'react-router'
import { BarreHaute } from './BarreHaute'
import { BarreLaterale } from './BarreLaterale'
import { useInactivite } from '../socle/hooks/useInactivite'
import { useSession } from '../socle/etat/useSession'
import { ModaleInactivite } from '../modules/authentification/composants/ModaleInactivite'
import { ChangementMotDePasseObligatoire } from '../modules/authentification/composants/ChangementMotDePasseObligatoire'
import { EcranAbonnementRequis } from '../modules/abonnement/composants/EcranAbonnementRequis'
import { useStatutEssai } from '../modules/abonnement/hooks/useAbonnement'

/** Coquille de l'application · PROPRIÉTAIRE : Boris */
export function CoquilleApp() {
  const deconnecter = useSession((e) => e.deconnecter)
  const doitChangerMotDePasse = useSession((e) => e.utilisateur?.mustChangePassword)
  const statutEssai = useStatutEssai()

  const { secondesRestantes, prolonger } = useInactivite({
    minutes: 20,
    avertissementSecondes: 60,
    onExpiration: () => deconnecter('INACTIVITE'),
  })

  // Un compte créé avec un mot de passe par défaut ne voit RIEN d'autre que
  // cet écran, quelle que soit l'URL demandée : ce n'est pas un rappel
  // contournable, c'est un blocage — même principe qu'ExigeRole pour les
  // droits d'accès.
  if (doitChangerMotDePasse) {
    return <ChangementMotDePasseObligatoire />
  }

  // Même principe pour l'établissement lui-même : essai expiré et aucun
  // abonnement actif bloque tout le reste, quel que soit le rôle connecté
  // (seul le Directeur peut lever le blocage, voir EcranAbonnementRequis).
  if (statutEssai.data?.evaluation.expire) {
    return <EcranAbonnementRequis />
  }

  return (
    <div className="bg-canvas flex h-screen overflow-hidden">
      <BarreLaterale />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarreHaute />
        <main className="flex-1 overflow-y-auto px-7 py-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>

      <ModaleInactivite
        secondesRestantes={secondesRestantes}
        onProlonger={prolonger}
        onFermerSession={() => deconnecter()}
      />
    </div>
  )
}
