/**
 * Registre des inscriptions · lot B (Alida)
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRightLeft, School, UserPlus } from 'lucide-react'
import { Bouton, MenuActions, Selecteur, useToast } from '../../../ui'
import type { Colonne } from '../../../ui'
import {
  BadgeStatut,
  GabaritListe,
  SelecteurClasse,
  formaterDate,
  formaterNomComplet,
} from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Classe, Eleve, Inscription } from '../../../socle/modeles/scolarite'
import type { Page } from '../../../socle/modeles/communs'
import { LIBELLE_STATUT_INSCRIPTION } from '../api'
import { useInscriptions, useTransfererVersClasse } from '../hooks/useInscriptions'
import { ModaleReinscription } from '../composants/ModaleReinscription'
import { ModaleTransfertClasse } from '../composants/ModaleTransfertClasse'

export default function ListeInscriptions() {
  const toast = useToast()
  const [classId, setClassId] = useState('')
  const [status, setStatus] = useState<Inscription['status'] | ''>('ACTIVE')
  const [reinscriptionOuverte, setReinscriptionOuverte] = useState(false)
  const [aTransferer, setATransferer] = useState<Inscription | null>(null)

  const requete = useInscriptions({ classId, status })
  const transferer = useTransfererVersClasse()

  const { data: eleves } = useQuery({
    queryKey: ['eleves', 'inscriptions'],
    queryFn: async () => (await api.get<Page<Eleve>>('/students', { params: { taille: 500 } })).data,
  })
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<Classe[]>('/classes')).data,
  })
  const nomEleve = (studentId: string) => {
    const eleve = eleves?.contenu.find((e) => e.id === studentId)
    return eleve ? formaterNomComplet(eleve.firstName, eleve.lastName) : studentId
  }
  const nomClasse = (id: string) => classes?.find((c) => c.id === id)?.name ?? id

  const colonnes: Colonne<Inscription>[] = [
    { cle: 'eleve', entete: 'Élève', rendu: (i) => nomEleve(i.studentId) },
    { cle: 'classe', entete: 'Classe', rendu: (i) => nomClasse(i.classId) },
    {
      cle: 'date',
      entete: 'Date',
      rendu: (i) => <span className="text-muted tabular-nums">{formaterDate(i.enrolledAt)}</span>,
    },
    {
      cle: 'type',
      entete: 'Type',
      rendu: (i) => (i.isRenewal ? 'Réinscription' : 'Nouvelle inscription'),
    },
    {
      cle: 'statut',
      entete: 'Statut',
      rendu: (i) => <BadgeStatut valeur={i.status} libelle={LIBELLE_STATUT_INSCRIPTION[i.status]} />,
    },
    {
      cle: 'actions',
      entete: '',
      className: 'text-right',
      rendu: (i) => (
        <MenuActions
          actions={[
            {
              libelle: 'Transférer vers une autre classe',
              icone: <ArrowRightLeft className="h-4 w-4" />,
              onClick: () => setATransferer(i),
              desactiveeCar:
                i.status !== 'ACTIVE' ? 'Seule une inscription active peut être transférée' : undefined,
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Inscriptions"
        sousTitre="Registre des inscriptions de l'année scolaire en cours."
        filAriane={['Scolarité']}
        actions={
          <Bouton icone={<UserPlus className="h-4 w-4" />} onClick={() => setReinscriptionOuverte(true)}>
            Réinscrire un élève
          </Bouton>
        }
        filtres={
          <>
            <SelecteurClasse valeur={classId} onChange={setClassId} />
            <Selecteur
              value={status}
              onChange={(e) => setStatus(e.target.value as Inscription['status'] | '')}
              placeholder="Tous les statuts"
              options={(Object.keys(LIBELLE_STATUT_INSCRIPTION) as Inscription['status'][]).map((s) => ({
                valeur: s,
                libelle: LIBELLE_STATUT_INSCRIPTION[s],
              }))}
            />
          </>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data}
        colonnes={colonnes}
        cleLigne={(i) => i.id}
        vide={{
          titre: 'Aucune inscription',
          description: 'Réinscrivez un élève ou créez-en un nouveau depuis le module Élèves.',
          icone: <School className="h-8 w-8" />,
          action: <Bouton onClick={() => setReinscriptionOuverte(true)}>Réinscrire un élève</Bouton>,
        }}
      />

      <ModaleReinscription ouverte={reinscriptionOuverte} onFermer={() => setReinscriptionOuverte(false)} />

      <ModaleTransfertClasse
        inscription={aTransferer}
        onFermer={() => setATransferer(null)}
        chargement={transferer.isPending}
        onConfirmer={async (classIdCible) => {
          if (!aTransferer) return
          await transferer.mutateAsync({ inscription: aTransferer, classIdCible })
          toast('succes', 'Le transfert a été effectué.')
          setATransferer(null)
        }}
      />
    </>
  )
}
