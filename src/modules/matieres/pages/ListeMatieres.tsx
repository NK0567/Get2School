/**
 * Liste des matières · lot B (Alida)
 *
 * Écran unique, sans fiche détaillée : une matière n'a que quatre champs de
 * référence, une modale suffit à en couvrir la création et l'édition.
 */
import { useState } from 'react'
import { Ban, BookOpen, CircleCheck, Pencil, Plus } from 'lucide-react'
import { Bouton, MenuActions, useToast } from '../../../ui'
import type { ActionMenu, Colonne } from '../../../ui'
import { BadgeStatut, GabaritListe } from '../../../communs'
import type { Matiere } from '../../../socle/modeles/scolarite'
import { useChangerStatutMatiere, useMatieres } from '../hooks/useMatieres'
import { ModaleMatiere } from '../composants/ModaleMatiere'

export default function ListeMatieres() {
  const toast = useToast()
  const requete = useMatieres()
  const changerStatut = useChangerStatutMatiere()

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [matiereEditee, setMatiereEditee] = useState<Matiere | null>(null)

  const ouvrirCreation = () => {
    setMatiereEditee(null)
    setModaleOuverte(true)
  }
  const ouvrirEdition = (matiere: Matiere) => {
    setMatiereEditee(matiere)
    setModaleOuverte(true)
  }

  const actionsDe = (matiere: Matiere): ActionMenu[] => [
    {
      libelle: 'Modifier',
      icone: <Pencil className="h-4 w-4" />,
      onClick: () => ouvrirEdition(matiere),
    },
    {
      libelle: matiere.isActive ? 'Désactiver' : 'Réactiver',
      icone: matiere.isActive ? <Ban className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />,
      destructif: matiere.isActive,
      onClick: async () => {
        await changerStatut.mutateAsync({ matiere, actif: !matiere.isActive })
        toast('succes', matiere.isActive ? 'La matière a été désactivée.' : 'La matière a été réactivée.')
      },
    },
  ]

  const colonnes: Colonne<Matiere>[] = [
    {
      cle: 'nom',
      entete: 'Matière',
      rendu: (m) => (
        <div>
          <div className="text-ink font-medium">{m.name}</div>
          <div className="text-muted text-xs">{m.code}</div>
        </div>
      ),
    },
    {
      cle: 'coefficient',
      entete: 'Coefficient',
      className: 'text-right',
      rendu: (m) => <span className="tabular-nums">{m.coefficient}</span>,
    },
    {
      cle: 'bareme',
      entete: 'Barème par défaut',
      className: 'text-right',
      rendu: (m) => <span className="tabular-nums">/{m.maxGrade}</span>,
    },
    {
      cle: 'statut',
      entete: 'Statut',
      rendu: (m) => <BadgeStatut valeur={m.isActive ? 'ACTIF' : 'INACTIF'} />,
    },
    {
      cle: 'actions',
      entete: '',
      className: 'text-right',
      rendu: (m) => <MenuActions actions={actionsDe(m)} />,
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Matières"
        sousTitre={`${requete.data?.length ?? 0} matière(s)`}
        filAriane={['Scolarité']}
        actions={
          <Bouton icone={<Plus className="h-4 w-4" />} onClick={ouvrirCreation}>
            Nouvelle matière
          </Bouton>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data}
        colonnes={colonnes}
        cleLigne={(m) => m.id}
        onLigneCliquee={ouvrirEdition}
        vide={{
          titre: 'Aucune matière',
          description: "Créez la première matière de l'établissement.",
          icone: <BookOpen className="h-8 w-8" />,
          action: <Bouton onClick={ouvrirCreation}>Nouvelle matière</Bouton>,
        }}
      />

      <ModaleMatiere
        ouverte={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
        matiere={matiereEditee}
      />
    </>
  )
}
