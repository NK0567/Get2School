/**
 * Liste des évaluations · lot C (Fabrice)
 *
 * Patron suivi : src/modules/utilisateurs/pages/ListeUtilisateurs.tsx.
 * Un enseignant ne voit et ne peut créer d'évaluations que sur ses propres
 * classes et matières : c'est la restriction la plus visible de tout ce lot,
 * et elle est appliquée par le filtre côté serveur (voir routes-academique.ts),
 * pas seulement par le SelecteurClasse qui ne liste que ses affectations.
 */
import { useState } from 'react'
import { ClipboardList, Plus, Send } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Bouton, MenuActions, useToast } from '../../../ui'
import type { ActionMenu, Colonne } from '../../../ui'
import {
  BadgeStatut,
  GabaritListe,
  SelecteurClasse,
  SelecteurMatiere,
  SelecteurPeriode,
  formaterDate,
  usePagination,
} from '../../../communs'
import type { Evaluation } from '../../../socle/modeles/academique'
import { useContexteScolaire } from '../../../socle/etat/useContexteScolaire'
import { LIBELLE_TYPE } from '../api'
import { useEvaluations, usePublierEvaluation } from '../hooks/useEvaluations'
import { ModaleNouvelleEvaluation } from '../composants/ModaleNouvelleEvaluation'

export default function ListeEvaluations() {
  const toast = useToast()
  const naviguer = useNavigate()
  const { periodeId } = useContexteScolaire()
  const { page, taille, setPage, reinitialiser } = usePagination(15)

  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [periode, setPeriode] = useState('')
  const [creationOuverte, setCreationOuverte] = useState(false)

  const requete = useEvaluations({
    classId,
    subjectId,
    periodId: periode || periodeId || undefined,
    page,
    taille,
  })
  const publier = usePublierEvaluation()

  const actionsDe = (evaluation: Evaluation): ActionMenu[] => [
    {
      libelle: 'Saisir les notes',
      onClick: () => naviguer(`/evaluations/${evaluation.id}/notes`),
      desactiveeCar: evaluation.status === 'DRAFT' ? "Publiez d'abord l'évaluation" : undefined,
    },
    {
      libelle: 'Publier',
      icone: <Send className="h-4 w-4" />,
      onClick: async () => {
        await publier.mutateAsync(evaluation)
        toast('succes', "L'évaluation est publiée et entre désormais dans le calcul des moyennes.")
      },
      desactiveeCar:
        evaluation.status !== 'DRAFT'
          ? evaluation.status === 'PUBLISHED'
            ? 'Déjà publiée'
            : 'Période verrouillée'
          : undefined,
    },
  ]

  const colonnes: Colonne<Evaluation>[] = [
    {
      cle: 'titre',
      entete: 'Évaluation',
      rendu: (e) => (
        <div>
          <div className="text-ink font-medium">{e.title}</div>
          <div className="text-muted text-xs">{LIBELLE_TYPE[e.type]}</div>
        </div>
      ),
    },
    {
      cle: 'date',
      entete: 'Date',
      rendu: (e) => <span className="text-muted tabular-nums">{formaterDate(e.date)}</span>,
    },
    {
      cle: 'bareme',
      entete: 'Barème · Coefficient',
      rendu: (e) => (
        <span className="tabular-nums">
          /{e.maxGrade} · ×{e.coefficient}
        </span>
      ),
    },
    { cle: 'statut', entete: 'Statut', rendu: (e) => <BadgeStatut valeur={e.status} /> },
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
        titre="Évaluations"
        sousTitre="Vos classes et vos matières uniquement."
        filAriane={['Académique']}
        actions={
          <Bouton icone={<Plus className="h-4 w-4" />} onClick={() => setCreationOuverte(true)}>
            Nouvelle évaluation
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
            <SelecteurMatiere
              valeur={subjectId}
              onChange={(v) => {
                setSubjectId(v)
                reinitialiser()
              }}
            />
            <SelecteurPeriode
              valeur={periode}
              onChange={(v) => {
                setPeriode(v)
                reinitialiser()
              }}
            />
          </>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data?.contenu}
        colonnes={colonnes}
        cleLigne={(e) => e.id}
        onLigneCliquee={(e) => naviguer(`/evaluations/${e.id}/notes`)}
        vide={{
          titre: 'Aucune évaluation',
          description: 'Créez une évaluation pour commencer à saisir des notes.',
          icone: <ClipboardList className="h-8 w-8" />,
          action: <Bouton onClick={() => setCreationOuverte(true)}>Nouvelle évaluation</Bouton>,
        }}
        pagination={{ page, taille, total: requete.data?.total ?? 0, onChange: setPage }}
      />

      <ModaleNouvelleEvaluation ouverte={creationOuverte} onFermer={() => setCreationOuverte(false)} />
    </>
  )
}
