/**
 * Élèves à risque · lot C (Fabrice)
 *
 * RG-16 : aucune recommandation algorithmique ne déclenche d'action
 * automatique. Le bandeau ci-dessous n'est pas une option d'affichage, il
 * fait partie de l'écran au même titre que le tableau : cet indicateur
 * signale un dossier à examiner, il ne prononce et n'entraîne aucune
 * décision. Toute mesure concernant un élève relève des responsables
 * habilités, conformément au règlement de l'établissement.
 */
import { useState } from 'react'
import { ShieldAlert, TriangleAlert } from 'lucide-react'
import { Alerte, Badge } from '../../../ui'
import type { Colonne } from '../../../ui'
import {
  GabaritListe,
  SelecteurClasse,
  SelecteurPeriode,
  formaterMoyenne,
  formaterPourcentage,
} from '../../../communs'
import { useContexteScolaire } from '../../../socle/etat/useContexteScolaire'
import type { NiveauRisque, ScoreRisqueEleve } from '../api'
import { LIBELLE_NIVEAU } from '../api'
import { useElevesARisque } from '../hooks/useAnalyses'

const TON_NIVEAU: Record<NiveauRisque, 'succes' | 'alerte' | 'danger'> = {
  LOW: 'succes',
  MEDIUM: 'alerte',
  HIGH: 'danger',
}

export default function ElevesARisque() {
  const { periodeId } = useContexteScolaire()
  const [classId, setClassId] = useState('')
  const [periode, setPeriode] = useState(periodeId ?? '')
  const selectionComplete = Boolean(classId && periode)

  const requete = useElevesARisque(classId, periode)

  const colonnes: Colonne<ScoreRisqueEleve>[] = [
    {
      cle: 'eleve',
      entete: 'Élève',
      rendu: (l) => (
        <div>
          <div className="text-ink font-medium">{l.fullName}</div>
          <div className="text-muted text-xs">{l.matricule}</div>
        </div>
      ),
    },
    {
      cle: 'niveau',
      entete: 'Niveau',
      rendu: (l) => (
        <span className="inline-flex items-center gap-1.5">
          {l.level === 'HIGH' && <ShieldAlert className="text-danger h-3.5 w-3.5" />}
          <Badge ton={TON_NIVEAU[l.level]}>{LIBELLE_NIVEAU[l.level]}</Badge>
        </span>
      ),
    },
    {
      cle: 'score',
      entete: 'Score',
      className: 'text-right',
      rendu: (l) => <span className="text-ink font-semibold tabular-nums">{l.score.toFixed(0)} / 100</span>,
    },
    {
      cle: 'moyenne',
      entete: 'Moyenne générale',
      className: 'text-right',
      rendu: (l) => <span className="text-muted tabular-nums">{formaterMoyenne(l.generalAverage)} / 20</span>,
    },
    {
      cle: 'facteurs',
      entete: 'Facteurs dominants',
      rendu: (l) => {
        const facteurs = [
          { libelle: 'moyenne', valeur: l.factors.average },
          { libelle: 'tendance', valeur: l.factors.trend },
          { libelle: 'absences', valeur: l.factors.absence },
          { libelle: 'discipline', valeur: l.factors.discipline },
        ]
          .filter((f) => f.valeur > 0)
          .sort((a, b) => b.valeur - a.valeur)
          .slice(0, 2)
        return facteurs.length === 0 ? (
          <span className="text-muted">—</span>
        ) : (
          <span className="text-muted text-xs">
            {facteurs
              .map((f) => `${f.libelle} (${formaterPourcentage((f.valeur / l.score) * 100)})`)
              .join(', ')}
          </span>
        )
      },
    },
  ]

  return (
    <GabaritListe
      titre="Élèves à risque"
      sousTitre="Indicateur calculé à partir de la moyenne, de la tendance, des absences et de la discipline."
      filAriane={['Académique', 'Analyses']}
      filtres={
        <>
          <SelecteurClasse valeur={classId} onChange={setClassId} requis />
          <SelecteurPeriode valeur={periode} onChange={setPeriode} requis />
        </>
      }
      alerte={
        <Alerte ton="alerte" titre="Cet indicateur ne décide de rien">
          Il signale un dossier à examiner, sans plus. Il ne prononce et ne déclenche aucune décision : toute
          mesure concernant un élève relève des responsables habilités, conformément au règlement de
          l'établissement.
        </Alerte>
      }
      chargement={selectionComplete && requete.isLoading}
      erreur={selectionComplete ? requete.error : undefined}
      lignes={selectionComplete ? requete.data : []}
      colonnes={colonnes}
      cleLigne={(l) => l.enrollmentId}
      vide={{
        titre: selectionComplete ? 'Aucun élève dans cette classe' : 'Choisissez une classe et une période',
        description: selectionComplete
          ? 'Aucune inscription active à afficher.'
          : "L'indicateur se calcule sur les évaluations, absences et incidents de la période sélectionnée.",
        icone: <TriangleAlert className="h-8 w-8" />,
      }}
    />
  )
}
