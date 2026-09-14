import { ShieldOff } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Bouton, EtatVide } from '../../../ui'
import { useSession } from '../../../socle/etat/useSession'
import { LIBELLE_ROLE } from '../../../socle/modeles/communs'

/**
 * RG-02 et principe du moindre privilege : un accès refusé est explique,
 * pas silencieux, et il est journalisé (voir ExigeRole).
 */
export default function PageAccesRefuse() {
  const naviguer = useNavigate()
  const roleActif = useSession((e) => e.roleActif)

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EtatVide
        titre="Accès refusé"
        description={`Votre role (${roleActif ? LIBELLE_ROLE[roleActif] : 'inconnu'}) ne permet pas d'ouvrir cet écran. Cette tentative à été enregistrée dans le journal d'audit.`}
        icone={<ShieldOff className="h-8 w-8" />}
        action={<Bouton onClick={() => naviguer('/tableau-de-bord')}>Retour au tableau de bord</Bouton>}
      />
    </div>
  )
}
