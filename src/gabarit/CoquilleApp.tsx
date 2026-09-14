import { Outlet } from 'react-router'
import { BarreHaute } from './BarreHaute'
import { BarreLaterale } from './BarreLaterale'
import { useInactivite } from '../socle/hooks/useInactivite'
import { useSession } from '../socle/etat/useSession'
import { ModaleInactivite } from '../modules/authentification/composants/ModaleInactivite'

/** Coquille de l'application · PROPRIÉTAIRE : Boris */
export function CoquilleApp() {
  const deconnecter = useSession((e) => e.deconnecter)

  const { secondesRestantes, prolonger } = useInactivite({
    minutes: 20,
    avertissementSecondes: 60,
    onExpiration: () => deconnecter('INACTIVITE'),
  })

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
