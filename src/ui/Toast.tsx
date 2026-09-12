import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react'
import { cn } from './cn'

type TonToast = 'succes' | 'alerte' | 'danger' | 'info'

interface Toast {
  id: number
  ton: TonToast
  message: string
}

const ICONES = {
  succes: CheckCircle2,
  alerte: TriangleAlert,
  danger: XCircle,
  info: Info,
}

const TONS: Record<TonToast, string> = {
  succes: 'border-success/30 text-success',
  alerte: 'border-warning/30 text-warning',
  danger: 'border-danger/30 text-danger',
  info: 'border-info/30 text-info',
}

const ContexteToast = createContext<(ton: TonToast, message: string) => void>(() => {})

/** Seule facon de confirmer une action. Pas d'alert() dans le projet. */
export function useToast() {
  return useContext(ContexteToast)
}

export function FournisseurToast({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const afficher = useCallback((ton: TonToast, message: string) => {
    const id = Date.now() + Math.random()
    setToasts((liste) => [...liste, { id, ton, message }])
    setTimeout(() => setToasts((liste) => liste.filter((t) => t.id !== id)), 4000)
  }, [])

  const valeur = useMemo(() => afficher, [afficher])

  return (
    <ContexteToast.Provider value={valeur}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => {
          const Icone = ICONES[t.ton]
          return (
            <div
              key={t.id}
              className={cn(
                'bg-surface flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-sm',
                TONS[t.ton],
              )}
            >
              <Icone className="h-4 w-4 shrink-0" />
              <span className="text-ink">{t.message}</span>
            </div>
          )
        })}
      </div>
    </ContexteToast.Provider>
  )
}
