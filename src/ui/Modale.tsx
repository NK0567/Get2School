import type { ReactNode } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'
import { cn } from './cn'

type Taille = 'sm' | 'md' | 'lg'

const TAILLES: Record<Taille, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[600px]',
  lg: 'max-w-[900px]',
}

interface Props {
  ouverte: boolean
  onFermer: () => void
  titre: string
  taille?: Taille
  children: ReactNode
  pied?: ReactNode
}

export function Modale({ ouverte, onFermer, titre, taille = 'md', children, pied }: Props) {
  return (
    <Dialog open={ouverte} onClose={onFermer} className="relative z-50">
      <div className="bg-ink/40 fixed inset-0" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className={cn('bg-surface w-full rounded-xl shadow-lg', TAILLES[taille])}>
          <div className="border-line flex items-center justify-between border-b px-5 py-4">
            <DialogTitle className="text-ink text-base font-semibold">{titre}</DialogTitle>
            <button
              onClick={onFermer}
              className="text-muted hover:bg-canvas rounded p-1 transition"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
          {pied && <div className="border-line flex justify-end gap-2 border-t px-5 py-3">{pied}</div>}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
