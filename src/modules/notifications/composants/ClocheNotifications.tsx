import { Bell } from 'lucide-react'
import { Link } from 'react-router'
import { useCompteurNonLues } from '../hooks/useNotifications'

export function ClocheNotifications() {
  const { data: nombre } = useCompteurNonLues()

  return (
    <Link
      to="/notifications"
      className="text-muted hover:bg-canvas hover:text-ink relative rounded-lg p-2 transition"
      title="Notifications"
      aria-label={nombre ? `${nombre} notification(s) non lue(s)` : 'Notifications'}
    >
      <Bell className="h-4 w-4" />
      {Boolean(nombre) && (
        <span className="bg-danger absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white tabular-nums">
          {nombre! > 9 ? '9+' : nombre}
        </span>
      )}
    </Link>
  )
}
