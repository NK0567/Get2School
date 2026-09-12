import { Outlet } from 'react-router'
import { BarreHaute } from './BarreHaute'
import { BarreLaterale } from './BarreLaterale'

/** Coquille de l'application · PROPRIETAIRE : Boris */
export function CoquilleApp() {
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
    </div>
  )
}
