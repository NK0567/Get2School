/**
 * Registre disciplinaire · lot C (Fabrice)
 *
 * RG-16 : aucune recommandation algorithmique ne déclenche d'action
 * automatique. Cet écran ne fait qu'afficher et permettre l'enregistrement
 * de faits et de décisions humaines ; rien ici ne décide à la place d'un
 * responsable.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Gavel, ShieldAlert } from 'lucide-react'
import { Badge, Bouton, MenuActions, Selecteur, useToast } from '../../../ui'
import type { ActionMenu, Colonne } from '../../../ui'
import {
  BadgeStatut,
  GabaritListe,
  SelecteurClasse,
  formaterDate,
  formaterNomComplet,
  usePagination,
} from '../../../communs'
import { api } from '../../../socle/api/client'
import type { EvenementDisciplinaire } from '../../../socle/modeles/academique'
import type { Eleve } from '../../../socle/modeles/scolarite'
import type { Page } from '../../../socle/modeles/communs'
import { LIBELLE_GRAVITE, LIBELLE_TYPE } from '../api'
import { useEvenementsDiscipline, useStatuerSurEvenement } from '../hooks/useDiscipline'
import { ModaleSignalement } from '../composants/ModaleSignalement'
import { ModaleDecision } from '../composants/ModaleDecision'

const TON_GRAVITE: Record<EvenementDisciplinaire['severity'], 'succes' | 'alerte' | 'danger'> = {
  LOW: 'succes',
  MEDIUM: 'alerte',
  HIGH: 'danger',
}

export default function RegistreDiscipline() {
  const toast = useToast()
  const { page, taille, setPage, reinitialiser } = usePagination(15)

  const [classId, setClassId] = useState('')
  const [severity, setSeverity] = useState<EvenementDisciplinaire['severity'] | ''>('')
  const [signalementOuvert, setSignalementOuvert] = useState(false)
  const [aStatuer, setAStatuer] = useState<EvenementDisciplinaire | null>(null)

  const requete = useEvenementsDiscipline({ classId, severity, page, taille })
  const statuer = useStatuerSurEvenement()

  const { data: eleves } = useQuery({
    queryKey: ['eleves', 'discipline-liste'],
    queryFn: async () => (await api.get<Page<Eleve>>('/students', { params: { taille: 500 } })).data,
  })
  const nomEleve = (studentId: string) => {
    const eleve = eleves?.contenu.find((e) => e.id === studentId)
    return eleve ? formaterNomComplet(eleve.firstName, eleve.lastName) : studentId
  }

  const actionsDe = (evenement: EvenementDisciplinaire): ActionMenu[] => [
    {
      libelle: evenement.decision ? 'Modifier la décision' : 'Statuer',
      icone: <Gavel className="h-4 w-4" />,
      onClick: () => setAStatuer(evenement),
    },
  ]

  const colonnes: Colonne<EvenementDisciplinaire>[] = [
    {
      cle: 'date',
      entete: 'Date',
      className: 'w-28',
      rendu: (e) => <span className="tabular-nums">{formaterDate(e.date)}</span>,
    },
    { cle: 'eleve', entete: 'Élève', rendu: (e) => nomEleve(e.studentId) },
    {
      cle: 'type',
      entete: 'Type',
      rendu: (e) => (
        <span className="inline-flex items-center gap-2">
          {e.severity === 'HIGH' && <ShieldAlert className="text-danger h-3.5 w-3.5 shrink-0" />}
          {LIBELLE_TYPE[e.type]}
        </span>
      ),
    },
    {
      cle: 'gravite',
      entete: 'Gravité',
      rendu: (e) => <Badge ton={TON_GRAVITE[e.severity]}>{LIBELLE_GRAVITE[e.severity]}</Badge>,
    },
    {
      cle: 'statut',
      entete: 'Dossier',
      rendu: (e) =>
        e.decision ? (
          <BadgeStatut valeur="PUBLISHED" libelle="Décidé" />
        ) : (
          <BadgeStatut valeur="DRAFT" libelle="En attente" />
        ),
    },
    {
      cle: 'actions',
      entete: '',
      className: 'text-right',
      rendu: (e) => <MenuActions actions={actionsDe(e)} />,
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Discipline"
        sousTitre="Signalement des faits, décision distincte et réservée aux responsables habilités."
        filAriane={['Académique']}
        actions={
          <Bouton icone={<Gavel className="h-4 w-4" />} onClick={() => setSignalementOuvert(true)}>
            Signaler un incident
          </Bouton>
        }
        filtres={
          <>
            <SelecteurClasse
              valeur={classId}
              onChange={(v) => {
                setClassId(v)
                reinitialiser()
              }}
            />
            <Selecteur
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value as EvenementDisciplinaire['severity'] | '')
                reinitialiser()
              }}
              placeholder="Toutes les gravités"
              options={(Object.keys(LIBELLE_GRAVITE) as (keyof typeof LIBELLE_GRAVITE)[]).map((g) => ({
                valeur: g,
                libelle: LIBELLE_GRAVITE[g],
              }))}
            />
          </>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data?.contenu}
        colonnes={colonnes}
        cleLigne={(e) => e.id}
        onLigneCliquee={setAStatuer}
        vide={{
          titre: 'Aucun événement disciplinaire',
          description: 'Le registre se remplit au fil des signalements.',
          icone: <Gavel className="h-8 w-8" />,
          action: <Bouton onClick={() => setSignalementOuvert(true)}>Signaler un incident</Bouton>,
        }}
        pagination={{ page, taille, total: requete.data?.total ?? 0, onChange: setPage }}
      />

      <ModaleSignalement ouverte={signalementOuvert} onFermer={() => setSignalementOuvert(false)} />

      <ModaleDecision
        ouverte={aStatuer !== null}
        eleveNom={aStatuer ? nomEleve(aStatuer.studentId) : ''}
        onFermer={() => setAStatuer(null)}
        chargement={statuer.isPending}
        onConfirmer={async (decision) => {
          if (!aStatuer) return
          await statuer.mutateAsync({ evenement: aStatuer, decision })
          toast('succes', 'La décision a été enregistrée.')
          setAStatuer(null)
        }}
      />
    </>
  )
}
