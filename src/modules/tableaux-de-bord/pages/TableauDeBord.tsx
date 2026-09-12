import { useQuery } from '@tanstack/react-query'
import { GraduationCap, School, UserCog, Users } from 'lucide-react'
import { api } from '../../../socle/api/client'
import { CarteStat, EnteteDePage } from '../../../ui'
import { useSession } from '../../../socle/etat/useSession'
import { LIBELLE_ROLE } from '../../../socle/modeles/communs'
import type { Classe, Eleve, Enseignant } from '../../../socle/modeles/scolarite'
import type { Page } from '../../../socle/modeles/communs'
import type { Utilisateur } from '../../../socle/modeles/administration'

/**
 * Tableau de bord commun. Chaque lot ajoute ici SON propre composant de
 * tableau de bord par role, dans son propre fichier, pour eviter les
 * conflits sur cette page.
 */
export default function TableauDeBord() {
  const roleActif = useSession((e) => e.roleActif)

  const { data: eleves } = useQuery({
    queryKey: ['eleves', 'total'],
    queryFn: async () => (await api.get<Page<Eleve>>('/students', { params: { taille: 1 } })).data,
  })
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<Classe[]>('/classes')).data,
  })
  const { data: enseignants } = useQuery({
    queryKey: ['enseignants'],
    queryFn: async () => (await api.get<Enseignant[]>('/teachers')).data,
  })
  const { data: utilisateurs } = useQuery({
    queryKey: ['utilisateurs', 'total'],
    queryFn: async () => (await api.get<Page<Utilisateur>>('/users', { params: { taille: 1 } })).data,
  })

  return (
    <>
      <EnteteDePage titre="Tableau de bord" sousTitre={roleActif ? LIBELLE_ROLE[roleActif] : undefined} />

      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
        <CarteStat
          libelle="Eleves inscrits"
          valeur={eleves?.total ?? 0}
          icone={<GraduationCap className="h-5 w-5" />}
        />
        <CarteStat libelle="Classes" valeur={classes?.length ?? 0} icone={<School className="h-5 w-5" />} />
        <CarteStat
          libelle="Enseignants"
          valeur={enseignants?.length ?? 0}
          icone={<UserCog className="h-5 w-5" />}
        />
        <CarteStat
          libelle="Comptes actifs"
          valeur={utilisateurs?.total ?? 0}
          icone={<Users className="h-5 w-5" />}
        />
      </div>
    </>
  )
}
