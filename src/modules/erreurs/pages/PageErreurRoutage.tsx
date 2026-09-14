import { TriangleAlert } from 'lucide-react'
import { useNavigate, useRouteError } from 'react-router'
import { Bouton, EtatVide } from '../../../ui'

/** Filet de sécurité au niveau du routeur. */
export default function PageErreurRoutage() {
  const erreur = useRouteError()
  const naviguer = useNavigate()
  const message = erreur instanceof Error ? erreur.message : "L'application à rencontre un problème."

  return (
    <div className="bg-canvas flex min-h-screen items-center justify-center px-4">
      <EtatVide
        titre="Une erreur est survenue"
        description={message}
        icone={<TriangleAlert className="text-danger h-8 w-8" />}
        action={<Bouton onClick={() => naviguer('/tableau-de-bord')}>Retour au tableau de bord</Bouton>}
      />
    </div>
  )
}
