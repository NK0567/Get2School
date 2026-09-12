import type { ReactNode } from 'react'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { MoreVertical } from 'lucide-react'
import { cn } from './cn'

export interface ActionMenu {
  libelle: string
  icone?: ReactNode
  onClick: () => void
  destructif?: boolean
  /** Desactive l'action et explique pourquoi en infobulle. Jamais de lien mort. */
  desactiveeCar?: string
}

/**
 * Menu a trois points des colonnes d'action · PROPRIETAIRE : Boris
 * Impose par la charte : la colonne d'actions est toujours la derniere,
 * alignee a droite.
 */
export function MenuActions({ actions }: { actions: ActionMenu[] }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton
        onClick={(e) => e.stopPropagation()}
        className="text-muted hover:bg-canvas hover:text-ink rounded-lg p-1.5 transition"
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="border-line bg-surface z-50 w-56 rounded-lg border py-1 shadow-lg focus:outline-none"
      >
        {actions.map((action) => (
          <MenuItem key={action.libelle}>
            <button
              disabled={Boolean(action.desactiveeCar)}
              title={action.desactiveeCar}
              onClick={(e) => {
                e.stopPropagation()
                action.onClick()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition',
                'data-[focus]:bg-canvas disabled:cursor-not-allowed disabled:opacity-40',
                action.destructif ? 'text-danger' : 'text-ink',
              )}
            >
              {action.icone}
              {action.libelle}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}
