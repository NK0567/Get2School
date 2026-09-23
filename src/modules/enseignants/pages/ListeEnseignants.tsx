/**
 * Liste des enseignants · lot B (Alida)
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, UserCog } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Bouton } from '../../../ui'
import type { Colonne } from '../../../ui'
import {
  BadgeStatut,
  ChampRecherche,
  GabaritListe,
  SelecteurMatiere,
  formaterNomComplet,
  useDebounce,
} from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Enseignant, Matiere } from '../../../socle/modeles/scolarite'
import { useEnseignants } from '../hooks/useEnseignants'
import { ModaleNouvelEnseignant } from '../composants/ModaleNouvelEnseignant'

export default function ListeEnseignants() {
  const naviguer = useNavigate()
  const [recherche, setRecherche] = useState('')
  const rechercheRetardee = useDebounce(recherche)
  const [subjectId, setSubjectId] = useState('')
  const [creationOuverte, setCreationOuverte] = useState(false)

  const requete = useEnseignants({ recherche: rechercheRetardee, subjectId })
  const { data: matieres } = useQuery({
    queryKey: ['matieres'],
    queryFn: async () => (await api.get<Matiere[]>('/subjects')).data,
  })
  const nomsMatieres = (ids: string[]) =>
    ids.map((id) => matieres?.find((m) => m.id === id)?.name ?? id).join(', ')

  const colonnes: Colonne<Enseignant>[] = [
    {
      cle: 'nom',
      entete: 'Enseignant',
      rendu: (e) => (
        <div>
          <div className="text-ink font-medium">{formaterNomComplet(e.firstName, e.lastName)}</div>
          <div className="text-muted text-xs">{e.phone}</div>
        </div>
      ),
    },
    {
      cle: 'matieres',
      entete: 'Matières',
      rendu: (e) => <span className="text-muted">{nomsMatieres(e.subjectIds)}</span>,
    },
    {
      cle: 'statut',
      entete: 'Statut',
      rendu: (e) => <BadgeStatut valeur={e.isActive ? 'ACTIF' : 'INACTIF'} />,
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Enseignants"
        sousTitre={`${requete.data?.length ?? 0} enseignant(s)`}
        filAriane={['Scolarité']}
        actions={
          <Bouton icone={<Plus className="h-4 w-4" />} onClick={() => setCreationOuverte(true)}>
            Nouvel enseignant
          </Bouton>
        }
        filtres={
          <>
            <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder="Nom" />
            <SelecteurMatiere valeur={subjectId} onChange={setSubjectId} />
          </>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data}
        colonnes={colonnes}
        cleLigne={(e) => e.id}
        onLigneCliquee={(e) => naviguer(`/enseignants/${e.id}`)}
        vide={{
          titre: 'Aucun enseignant',
          description: 'Créez la fiche du premier enseignant.',
          icone: <UserCog className="h-8 w-8" />,
          action: <Bouton onClick={() => setCreationOuverte(true)}>Nouvel enseignant</Bouton>,
        }}
      />

      <ModaleNouvelEnseignant ouverte={creationOuverte} onFermer={() => setCreationOuverte(false)} />
    </>
  )
}
