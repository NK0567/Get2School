import { NavLink } from 'react-router'
import { MENU } from './menu'
import { useSession } from '../socle/etat/useSession'
import { cn } from '../ui/cn'

export function BarreLaterale() {
  const roleActif = useSession((e) => e.roleActif)

  const groupes = MENU.map((g) => ({
    ...g,
    entrees: g.entrees.filter((e) => roleActif && e.roles.includes(roleActif)),
  })).filter((g) => g.entrees.length > 0)

  return (
    <aside className="bg-ink flex w-[260px] shrink-0 flex-col overflow-y-auto text-white/80">
      <div className="flex h-[60px] shrink-0 items-center gap-2 px-5 text-lg font-semibold text-white">
        Get2School
      </div>

      <nav className="flex flex-col gap-5 px-3 pb-6">
        {groupes.map((groupe) => (
          <div key={groupe.titre}>
            <div className="mb-1.5 px-2 text-[11px] font-semibold tracking-wider text-white/40 uppercase">
              {groupe.titre}
            </div>
            <div className="flex flex-col gap-0.5">
              {groupe.entrees.map((entree) => {
                const Icone = entree.icone
                return (
                  <NavLink
                    key={entree.chemin}
                    to={entree.chemin}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition',
                        isActive ? 'bg-primary text-white' : 'hover:bg-white/10 hover:text-white',
                      )
                    }
                  >
                    <Icone className="h-4 w-4 shrink-0" />
                    {entree.libelle}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
