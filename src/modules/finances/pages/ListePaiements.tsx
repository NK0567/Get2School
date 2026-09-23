/**
 * Paiements · lot B (Alida)
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Ban, CreditCard, Plus } from 'lucide-react'
import { Bouton, MenuActions, useToast } from '../../../ui'
import type { Colonne } from '../../../ui'
import {
  BadgeStatut,
  GabaritListe,
  formaterDateHeure,
  formaterMontant,
  formaterNomComplet,
} from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Eleve } from '../../../socle/modeles/scolarite'
import type { Frais, Paiement } from '../../../socle/modeles/finances'
import type { Page } from '../../../socle/modeles/communs'
import { LIBELLE_METHODE } from '../api'
import { useAnnulerPaiement, useFrais, usePaiements } from '../hooks/useFinances'
import { ModaleNouveauPaiement } from '../composants/ModaleNouveauPaiement'
import { ModaleAnnulationPaiement } from '../composants/ModaleAnnulationPaiement'

export default function ListePaiements() {
  const toast = useToast()
  const requete = usePaiements({})
  const { data: frais } = useFrais()
  const annuler = useAnnulerPaiement()

  const [creationOuverte, setCreationOuverte] = useState(false)
  const [aAnnuler, setAAnnuler] = useState<Paiement | null>(null)

  const { data: eleves } = useQuery({
    queryKey: ['eleves', 'paiements-liste'],
    queryFn: async () => (await api.get<Page<Eleve>>('/students', { params: { taille: 500 } })).data,
  })
  const nomEleve = (studentId: string) => {
    const eleve = eleves?.contenu.find((e) => e.id === studentId)
    return eleve ? formaterNomComplet(eleve.firstName, eleve.lastName) : studentId
  }
  const nomFrais = (id: string) => frais?.find((f: Frais) => f.id === id)?.label ?? id

  const colonnes: Colonne<Paiement>[] = [
    {
      cle: 'reference',
      entete: 'Référence',
      rendu: (p) => <code className="text-[12px] tabular-nums">{p.reference}</code>,
    },
    { cle: 'eleve', entete: 'Élève', rendu: (p) => nomEleve(p.studentId) },
    { cle: 'frais', entete: 'Frais', rendu: (p) => nomFrais(p.feeItemId) },
    {
      cle: 'montant',
      entete: 'Montant',
      className: 'text-right',
      rendu: (p) => <span className="font-medium tabular-nums">{formaterMontant(p.amount)}</span>,
    },
    { cle: 'methode', entete: 'Moyen', rendu: (p) => LIBELLE_METHODE[p.method] },
    {
      cle: 'date',
      entete: 'Date',
      rendu: (p) => <span className="text-muted tabular-nums">{formaterDateHeure(p.paidAt)}</span>,
    },
    { cle: 'statut', entete: 'Statut', rendu: (p) => <BadgeStatut valeur={p.status} /> },
    {
      cle: 'actions',
      entete: '',
      className: 'text-right',
      rendu: (p) => (
        <MenuActions
          actions={[
            {
              libelle: 'Annuler',
              icone: <Ban className="h-4 w-4" />,
              destructif: true,
              onClick: () => setAAnnuler(p),
              desactiveeCar: p.status === 'CANCELLED' ? 'Déjà annulé' : undefined,
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Paiements"
        sousTitre={`${requete.data?.length ?? 0} paiement(s) enregistré(s)`}
        filAriane={['Scolarité', 'Finance']}
        actions={
          <Bouton icone={<Plus className="h-4 w-4" />} onClick={() => setCreationOuverte(true)}>
            Enregistrer un paiement
          </Bouton>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data}
        colonnes={colonnes}
        cleLigne={(p) => p.id}
        vide={{
          titre: 'Aucun paiement enregistré',
          description: 'Enregistrez le premier paiement pour générer son reçu.',
          icone: <CreditCard className="h-8 w-8" />,
          action: <Bouton onClick={() => setCreationOuverte(true)}>Enregistrer un paiement</Bouton>,
        }}
      />

      <ModaleNouveauPaiement ouverte={creationOuverte} onFermer={() => setCreationOuverte(false)} />

      <ModaleAnnulationPaiement
        paiement={aAnnuler}
        onFermer={() => setAAnnuler(null)}
        chargement={annuler.isPending}
        onConfirmer={async (motif) => {
          if (!aAnnuler) return
          await annuler.mutateAsync({ paiement: aAnnuler, motif })
          toast('succes', 'Le paiement a été annulé.')
          setAAnnuler(null)
        }}
      />
    </>
  )
}
