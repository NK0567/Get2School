import { FileQuestion } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Bouton, EtatVide } from '../../../ui'

export default function PageNonTrouvee() {
  const naviguer = useNavigate()
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EtatVide
        titre="Cette page n'existe pas"
        description="Le lien est peut-être errone, ou l'écran n'a pas encore été construit."
        icone={<FileQuestion className="h-8 w-8" />}
        action={<Bouton onClick={() => naviguer('/tableau-de-bord')}>Retour au tableau de bord</Bouton>}
      />
    </div>
  )
}
