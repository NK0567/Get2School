import { useState } from 'react'
import { Archive, CalendarRange, DoorOpen, Plus, SlidersHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Alerte, Bouton, DialogueConfirmation, MenuActions, useToast } from '../../../ui'
import type { ActionMenu, Colonne } from '../../../ui'
import { BadgeStatut, GabaritListe, formaterDate, useConfirmation } from '../../../communs'
import type { AnneeScolaire } from '../../../socle/modeles/administration'
import { useContexteScolaire } from '../../../socle/etat/useContexteScolaire'
import { useAnneesScolaires, useCloturerAnnee, useOuvrirAnnee } from '../hooks/useAnneesScolaires'
import { ModaleNouvelleAnnee } from '../composants/ModaleNouvelleAnnee'

export default function ListeAnneesScolaires() {
  const toast = useToast()
  const naviguer = useNavigate()
  const definirAnnee = useContexteScolaire((e) => e.definirAnnee)

  const requete = useAnneesScolaires()
  const ouvrir = useOuvrirAnnee()
  const cloturer = useCloturerAnnee()
  const confirmationOuverture = useConfirmation<AnneeScolaire>()
  const confirmationCloture = useConfirmation<AnneeScolaire>()
  const [creationOuverte, setCreationOuverte] = useState(false)

  const annees = requete.data ?? []
  const anneeOuverte = annees.find((a) => a.status === 'OPEN')

  const actionsDe = (annee: AnneeScolaire): ActionMenu[] => [
    {
      libelle: 'Voir les périodes',
      icone: <SlidersHorizontal className="h-4 w-4" />,
      onClick: () => naviguer(`/annees-scolaires/${annee.id}/periodes`),
    },
    {
      libelle: "Ouvrir l'année",
      icone: <DoorOpen className="h-4 w-4" />,
      onClick: () => confirmationOuverture.demander(annee),
      desactiveeCar:
        annee.status === 'OPEN'
          ? 'Cette année est déjà ouverte'
          : annee.status === 'CLOSED'
            ? 'Une année clôturée ne se rouvre pas'
            : anneeOuverte
              ? `L'année ${anneeOuverte.label} est déjà ouverte`
              : undefined,
    },
    {
      libelle: "Clôturer l'année",
      icone: <Archive className="h-4 w-4" />,
      destructif: true,
      onClick: () => confirmationCloture.demander(annee),
      desactiveeCar: annee.status !== 'OPEN' ? 'Seule une année ouverte peut être clôturée' : undefined,
    },
  ]

  const colonnes: Colonne<AnneeScolaire>[] = [
    {
      cle: 'label',
      entete: 'Année',
      rendu: (a) => <span className="font-medium tabular-nums">{a.label}</span>,
    },
    {
      cle: 'dates',
      entete: 'Période couverte',
      rendu: (a) => (
        <span className="text-muted tabular-nums">
          {formaterDate(a.startDate)} au {formaterDate(a.endDate)}
        </span>
      ),
    },
    {
      cle: 'periodes',
      entete: 'Découpage',
      rendu: (a) => {
        const verrouillees = a.periods.filter((p) => p.isLocked).length
        return (
          <span className="text-muted">
            {a.periods.length} période(s)
            {verrouillees > 0 && ` · ${verrouillees} verrouillée(s)`}
          </span>
        )
      },
    },
    { cle: 'statut', entete: 'Statut', rendu: (a) => <BadgeStatut valeur={a.status} /> },
    {
      cle: 'actions',
      entete: '',
      className: 'text-right',
      rendu: (a) => <MenuActions actions={actionsDe(a)} />,
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Années scolaires"
        sousTitre="Une seule année peut être ouverte à la fois."
        filAriane={['Administration']}
        actions={
          <Bouton icone={<Plus className="h-4 w-4" />} onClick={() => setCreationOuverte(true)}>
            Nouvelle année
          </Bouton>
        }
        alerte={
          !anneeOuverte && annees.length > 0 ? (
            <Alerte ton="alerte" titre="Aucune année ouverte">
              Tant qu'aucune année n'est ouverte, les inscriptions, les évaluations et les paiements ne
              peuvent pas être enregistrés.
            </Alerte>
          ) : undefined
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={annees}
        colonnes={colonnes}
        cleLigne={(a) => a.id}
        onLigneCliquee={(a) => naviguer(`/annees-scolaires/${a.id}/periodes`)}
        vide={{
          titre: 'Aucune année scolaire',
          description: 'Créez la première année pour commencer à inscrire des élèves.',
          icone: <CalendarRange className="h-8 w-8" />,
          action: <Bouton onClick={() => setCreationOuverte(true)}>Nouvelle année</Bouton>,
        }}
      />

      <ModaleNouvelleAnnee ouverte={creationOuverte} onFermer={() => setCreationOuverte(false)} />

      <DialogueConfirmation
        ouverte={confirmationOuverture.ouverte}
        onFermer={confirmationOuverture.annuler}
        titre="Ouvrir cette année scolaire"
        destructif={false}
        message={`L'année ${confirmationOuverture.cible?.label ?? ''} deviendra l'année de travail. Son nombre de périodes sera figé définitivement.`}
        libelleAction="Ouvrir l'année"
        chargement={ouvrir.isPending}
        onConfirmer={async () => {
          const cible = confirmationOuverture.cible
          if (!cible) return
          try {
            await ouvrir.mutateAsync(cible)
            definirAnnee(cible.id)
            toast('succes', `L'année ${cible.label} est ouverte.`)
          } catch (erreur) {
            toast('danger', (erreur as { message?: string })?.message ?? "L'ouverture a échoué.")
          }
          confirmationOuverture.annuler()
        }}
      />

      <DialogueConfirmation
        ouverte={confirmationCloture.ouverte}
        onFermer={confirmationCloture.annuler}
        titre="Clôturer cette année scolaire"
        message={`Toutes les périodes de ${confirmationCloture.cible?.label ?? ''} seront verrouillées et l'année passera en consultation seule. Aucune donnée n'est supprimée.`}
        libelleAction="Clôturer l'année"
        chargement={cloturer.isPending}
        onConfirmer={async () => {
          const cible = confirmationCloture.cible
          if (!cible) return
          try {
            await cloturer.mutateAsync(cible)
            toast('succes', `L'année ${cible.label} est clôturée et archivée.`)
          } catch (erreur) {
            toast('danger', (erreur as { message?: string })?.message ?? 'La clôture a échoué.')
          }
          confirmationCloture.annuler()
        }}
      />
    </>
  )
}
