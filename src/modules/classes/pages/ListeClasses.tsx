/**
 * Liste des classes · lot B (Alida)
 */
import { useState } from 'react'
import { Plus, School } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Bouton, Selecteur } from '../../../ui'
import type { Colonne } from '../../../ui'
import { GabaritListe } from '../../../communs'
import type { Classe } from '../../../socle/modeles/scolarite'
import { NIVEAUX_CONNUS } from '../api'
import { useClasses } from '../hooks/useClasses'
import { ModaleNouvelleClasse } from '../composants/ModaleNouvelleClasse'

export default function ListeClasses() {
  const naviguer = useNavigate()
  const [level, setLevel] = useState('')
  const [creationOuverte, setCreationOuverte] = useState(false)

  const requete = useClasses({ level })

  const colonnes: Colonne<Classe>[] = [
    {
      cle: 'nom',
      entete: 'Classe',
      rendu: (c) => (
        <div>
          <div className="text-ink font-medium">{c.name}</div>
          <div className="text-muted text-xs">
            {c.level}
            {c.series ? ` · ${c.series}` : ''}
          </div>
        </div>
      ),
    },
    {
      cle: 'effectif',
      entete: 'Effectif',
      className: 'text-right',
      rendu: (c) => (
        <span className="tabular-nums">
          {c.studentCount} / {c.capacity}
        </span>
      ),
    },
    {
      cle: 'salle',
      entete: 'Salle',
      rendu: (c) => <span className="text-muted">{c.roomId ?? '—'}</span>,
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Classes"
        sousTitre={`${requete.data?.length ?? 0} classe(s) sur l'année en cours`}
        filAriane={['Scolarité']}
        actions={
          <Bouton icone={<Plus className="h-4 w-4" />} onClick={() => setCreationOuverte(true)}>
            Nouvelle classe
          </Bouton>
        }
        filtres={
          <Selecteur
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Tous les niveaux"
            options={NIVEAUX_CONNUS.map((n) => ({ valeur: n, libelle: n }))}
          />
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data}
        colonnes={colonnes}
        cleLigne={(c) => c.id}
        onLigneCliquee={(c) => naviguer(`/classes/${c.id}`)}
        vide={{
          titre: 'Aucune classe',
          description: "Créez la première classe de l'année scolaire.",
          icone: <School className="h-8 w-8" />,
          action: <Bouton onClick={() => setCreationOuverte(true)}>Nouvelle classe</Bouton>,
        }}
      />

      <ModaleNouvelleClasse ouverte={creationOuverte} onFermer={() => setCreationOuverte(false)} />
    </>
  )
}
