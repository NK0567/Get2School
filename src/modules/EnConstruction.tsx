import { Construction } from 'lucide-react'
import { EnteteDePage, EtatVide } from '../ui'

/**
 * Ecran temporaire pour les routes declarees mais pas encore construites.
 * Evite les liens morts, qui sont interdits par la charte.
 */
export default function EnConstruction({ titre }: { titre: string }) {
  return (
    <>
      <EnteteDePage titre={titre} />
      <EtatVide
        titre="Ecran en cours de construction"
        description="Cette fonctionnalite est declaree dans les user stories et sera livree dans une prochaine version."
        icone={<Construction className="h-8 w-8" />}
      />
    </>
  )
}
