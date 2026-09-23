/**
 * Liste des élèves · lot B (Alida)
 *
 * Patron suivi : src/modules/utilisateurs/pages/ListeUtilisateurs.tsx.
 */
import { useState } from 'react'
import { GraduationCap, Plus } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Bouton, Selecteur } from '../../../ui'
import type { Colonne } from '../../../ui'
import {
  BadgeStatut,
  ChampRecherche,
  GabaritListe,
  SelecteurClasse,
  formaterNomComplet,
  useDebounce,
  usePagination,
} from '../../../communs'
import type { Eleve } from '../../../socle/modeles/scolarite'
import { LIBELLE_STATUT } from '../api'
import { useEleves } from '../hooks/useEleves'

export default function ListeEleves() {
  const naviguer = useNavigate()
  const { page, taille, setPage, reinitialiser } = usePagination(15)

  const [recherche, setRecherche] = useState('')
  const rechercheRetardee = useDebounce(recherche)
  const [classId, setClassId] = useState('')
  const [status, setStatus] = useState<Eleve['status'] | ''>('ACTIVE')

  const requete = useEleves({ recherche: rechercheRetardee, classId, status, page, taille })

  const colonnes: Colonne<Eleve>[] = [
    {
      cle: 'nom',
      entete: 'Élève',
      rendu: (e) => (
        <div>
          <div className="text-ink font-medium">{formaterNomComplet(e.firstName, e.lastName)}</div>
          <div className="text-muted text-xs">{e.matricule}</div>
        </div>
      ),
    },
    {
      cle: 'tuteur',
      entete: 'Tuteur',
      rendu: (e) => (
        <div>
          <div>{e.guardianName}</div>
          <div className="text-muted text-xs">{e.guardianPhone}</div>
        </div>
      ),
    },
    {
      cle: 'statut',
      entete: 'Statut',
      rendu: (e) => (
        <BadgeStatut valeur={e.status === 'ACTIVE' ? 'ACTIF' : e.status} libelle={LIBELLE_STATUT[e.status]} />
      ),
    },
  ]

  return (
    <GabaritListe
      titre="Élèves"
      sousTitre={`${requete.data?.total ?? 0} élève(s) dans l'établissement`}
      filAriane={['Scolarité']}
      actions={
        <Bouton icone={<Plus className="h-4 w-4" />} onClick={() => naviguer('/eleves/nouveau')}>
          Nouvel élève
        </Bouton>
      }
      filtres={
        <>
          <ChampRecherche
            valeur={recherche}
            onChange={(v) => {
              setRecherche(v)
              reinitialiser()
            }}
            placeholder="Nom ou matricule"
          />
          <SelecteurClasse
            valeur={classId}
            onChange={(v) => {
              setClassId(v)
              reinitialiser()
            }}
          />
          <Selecteur
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as Eleve['status'] | '')
              reinitialiser()
            }}
            placeholder="Tous les statuts"
            options={(Object.keys(LIBELLE_STATUT) as Eleve['status'][]).map((s) => ({
              valeur: s,
              libelle: LIBELLE_STATUT[s],
            }))}
          />
        </>
      }
      chargement={requete.isLoading}
      erreur={requete.error}
      lignes={requete.data?.contenu}
      colonnes={colonnes}
      cleLigne={(e) => e.id}
      onLigneCliquee={(e) => naviguer(`/eleves/${e.id}`)}
      vide={{
        titre: 'Aucun élève ne correspond à ces critères',
        description: 'Modifiez la recherche ou inscrivez un nouvel élève.',
        icone: <GraduationCap className="h-8 w-8" />,
        action: <Bouton onClick={() => naviguer('/eleves/nouveau')}>Nouvel élève</Bouton>,
      }}
      pagination={{ page, taille, total: requete.data?.total ?? 0, onChange: setPage }}
    />
  )
}
