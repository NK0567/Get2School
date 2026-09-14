import type { ReactNode } from 'react'

interface Props {
  titre: string
  sousTitre?: string
  children: ReactNode
  pied?: ReactNode
}

/** Mise en page commune aux écrans accessibles sans être connecté. */
export function CadreAuthentification({ titre, sousTitre, children, pied }: Props) {
  return (
    <div className="bg-canvas flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="border-line bg-surface rounded-xl border p-7">
          <div className="text-ink mb-1 text-2xl font-semibold">Get2School</div>
          <h1 className="text-ink text-base font-semibold">{titre}</h1>
          {sousTitre && <p className="text-muted mt-1 mb-5 text-sm">{sousTitre}</p>}
          <div className={sousTitre ? '' : 'mt-5'}>{children}</div>
        </div>
        {pied && <div className="text-muted mt-4 text-center text-[13px]">{pied}</div>}
      </div>
    </div>
  )
}
