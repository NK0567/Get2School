/**
 * Liste des salles · lot B (Alida)
 */
import { useState } from 'react'
import { Ban, CircleCheck, DoorOpen, Pencil, Plus } from 'lucide-react'
import { Alerte, Bouton, MenuActions, Modale, useToast } from '../../../ui'
import type { ActionMenu, Colonne } from '../../../ui'
import { BadgeStatut, GabaritListe } from '../../../communs'
import type { Salle } from '../../../socle/modeles/scolarite'
import { LIBELLE_TYPE_SALLE } from '../api'
import { useChangerDisponibiliteSalle, useSalles } from '../hooks/useSalles'
import { ModaleSalle } from '../composants/ModaleSalle'

export default function ListeSalles() {
  const toast = useToast()
  const requete = useSalles()
  const changerDisponibilite = useChangerDisponibiliteSalle()

  const [modaleOuverte, setModaleOuverte] = useState(false)
  const [salleEditee, setSalleEditee] = useState<Salle | null>(null)
  const [salleAIndisponibiliser, setSalleAIndisponibiliser] = useState<Salle | null>(null)
  const [classesConcernees, setClassesConcernees] = useState<string[]>([])

  const ouvrirCreation = () => {
    setSalleEditee(null)
    setModaleOuverte(true)
  }
  const ouvrirEdition = (salle: Salle) => {
    setSalleEditee(salle)
    setModaleOuverte(true)
  }

  const actionsDe = (salle: Salle): ActionMenu[] => [
    {
      libelle: 'Modifier',
      icone: <Pencil className="h-4 w-4" />,
      onClick: () => ouvrirEdition(salle),
    },
    {
      libelle: salle.isAvailable ? 'Marquer indisponible' : 'Marquer disponible',
      icone: salle.isAvailable ? <Ban className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />,
      onClick: async () => {
        if (salle.isAvailable) {
          const resultat = await changerDisponibilite.mutateAsync({ salle, disponible: false })
          if (resultat.classesConcernees.length > 0) {
            setSalleAIndisponibiliser(salle)
            setClassesConcernees(resultat.classesConcernees)
          } else {
            toast('succes', 'La salle a été marquée indisponible.')
          }
        } else {
          await changerDisponibilite.mutateAsync({ salle, disponible: true })
          toast('succes', 'La salle a été marquée disponible.')
        }
      },
    },
  ]

  const colonnes: Colonne<Salle>[] = [
    {
      cle: 'nom',
      entete: 'Salle',
      rendu: (s) => <span className="text-ink font-medium">{s.name}</span>,
    },
    { cle: 'type', entete: 'Type', rendu: (s) => LIBELLE_TYPE_SALLE[s.type] },
    {
      cle: 'capacite',
      entete: 'Capacité',
      className: 'text-right',
      rendu: (s) => <span className="tabular-nums">{s.capacity} places</span>,
    },
    {
      cle: 'disponibilite',
      entete: 'Disponibilité',
      rendu: (s) => (
        <BadgeStatut
          valeur={s.isAvailable ? 'ACTIF' : 'INACTIF'}
          libelle={s.isAvailable ? 'Disponible' : 'Indisponible'}
        />
      ),
    },
    {
      cle: 'actions',
      entete: '',
      className: 'text-right',
      rendu: (s) => <MenuActions actions={actionsDe(s)} />,
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Salles"
        sousTitre={`${requete.data?.length ?? 0} salle(s)`}
        filAriane={['Scolarité']}
        actions={
          <Bouton icone={<Plus className="h-4 w-4" />} onClick={ouvrirCreation}>
            Nouvelle salle
          </Bouton>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data}
        colonnes={colonnes}
        cleLigne={(s) => s.id}
        onLigneCliquee={ouvrirEdition}
        vide={{
          titre: 'Aucune salle',
          description: "Créez la première salle de l'établissement.",
          icone: <DoorOpen className="h-8 w-8" />,
          action: <Bouton onClick={ouvrirCreation}>Nouvelle salle</Bouton>,
        }}
      />

      <ModaleSalle ouverte={modaleOuverte} onFermer={() => setModaleOuverte(false)} salle={salleEditee} />

      <Modale
        ouverte={salleAIndisponibiliser !== null}
        onFermer={() => setSalleAIndisponibiliser(null)}
        titre="Salle marquée indisponible"
        taille="sm"
        pied={<Bouton onClick={() => setSalleAIndisponibiliser(null)}>Compris</Bouton>}
      >
        <Alerte ton="alerte">
          {classesConcernees.length} classe(s) référencent encore cette salle : {classesConcernees.join(', ')}
          . Ce n'est pas bloqué : pensez à leur attribuer une autre salle depuis leur fiche.
        </Alerte>
      </Modale>
    </>
  )
}
