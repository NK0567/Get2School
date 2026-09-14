/**
 * Tableau de bord · PROPRIETAIRE : Boris · FIGE
 *
 * La rangee de statistiques est commune a tous les rôles. Le bloc du dessous
 * depend du rôle et vit dans le fichier du lot concerne (voir registre.ts).
 */
import { useQuery } from '@tanstack/react-query'
import { GraduationCap, School, UserCog, Users } from 'lucide-react'
import { api } from '../../../socle/api/client'
import { useSession } from '../../../socle/etat/useSession'
import { LIBELLE_ROLE } from '../../../socle/modeles/communs'
import type { Page } from '../../../socle/modeles/communs'
import type { Utilisateur } from '../../../socle/modeles/administration'
import type { Classe, Eleve, Enseignant } from '../../../socle/modeles/scolarite'
import { CarteStat, EnteteDePage } from '../../../ui'
import { BLOC_PAR_ROLE } from '../registre'

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

  const Bloc = roleActif ? BLOC_PAR_ROLE[roleActif] : null

  return (
    <>
      <EnteteDePage titre="Tableau de bord" sousTitre={roleActif ? LIBELLE_ROLE[roleActif] : undefined} />

      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
        <CarteStat
          libelle="Élèves inscrits"
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
          libelle="Comptes"
          valeur={utilisateurs?.total ?? 0}
          icone={<Users className="h-5 w-5" />}
        />
      </div>

      {Bloc && <Bloc />}
    </>
  )
}
