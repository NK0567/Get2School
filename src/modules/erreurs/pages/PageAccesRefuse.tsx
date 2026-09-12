import { ShieldOff } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Bouton, EtatVide } from '../../../ui'
import { useSession } from '../../../socle/etat/useSession'
import { LIBELLE_ROLE } from '../../../socle/modeles/communs'

/**
 * RG-02 et principe du moindre privilege : un acces refuse est explique,
 * pas silencieux, et il est journalise (voir ExigeRole).
 */
export default function PageAccesRefuse() {
  const naviguer = useNavigate()
  const roleActif = useSession((e) => e.roleActif)

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EtatVide
        titre="Acces refuse"
        description={`Votre role (${roleActif ? LIBELLE_ROLE[roleActif] : 'inconnu'}) ne permet pas d'ouvrir cet ecran. Cette tentative a ete enregistree dans le journal d'audit.`}
        icone={<ShieldOff className="h-8 w-8" />}
        action={<Bouton onClick={() => naviguer('/tableau-de-bord')}>Retour au tableau de bord</Bouton>}
      />
    </div>
  )
}
