/**
 * Listes financières · lot B (Alida)
 */
import { useState } from 'react'
import { Download, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Badge, Bouton } from '../../../ui'
import type { Colonne } from '../../../ui'
import { GabaritListe, SelecteurClasse, exporterCsv, formaterMontant } from '../../../communs'
import { LIBELLE_STATUT_FINANCIER } from '../api'
import type { LigneSituationClasse } from '../api'
import { useSituationClasse } from '../hooks/useFinances'

const TON_STATUT: Record<string, 'succes' | 'alerte' | 'danger' | 'info'> = {
  PAID: 'succes',
  PARTIAL: 'alerte',
  UNPAID: 'danger',
  EXEMPT: 'info',
}

export default function ListesFinancieres() {
  const naviguer = useNavigate()
  const [classId, setClassId] = useState('')
  const requete = useSituationClasse(classId)

  const colonnes: Colonne<LigneSituationClasse>[] = [
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
      cle: 'du',
      entete: 'Dû',
      className: 'text-right',
      rendu: (l) => <span className="tabular-nums">{formaterMontant(l.due)}</span>,
    },
    {
      cle: 'paye',
      entete: 'Payé',
      className: 'text-right',
      rendu: (l) => <span className="tabular-nums">{formaterMontant(l.paid)}</span>,
    },
    {
      cle: 'solde',
      entete: 'Solde',
      className: 'text-right',
      rendu: (l) => (
        <span className={`font-medium tabular-nums ${l.balance > 0 ? 'text-danger' : 'text-ink'}`}>
          {formaterMontant(l.balance)}
        </span>
      ),
    },
    {
      cle: 'statut',
      entete: 'Statut',
      rendu: (l) => (
        <span className="inline-flex items-center gap-1.5">
          <Badge ton={TON_STATUT[l.status]}>{LIBELLE_STATUT_FINANCIER[l.status]}</Badge>
          {l.isOverdue && <Badge ton="danger">En retard</Badge>}
        </span>
      ),
    },
  ]

  return (
    <GabaritListe
      titre="Listes financières"
      sousTitre="Situation de solvabilité par classe, calculée en direct."
      filAriane={['Scolarité', 'Finance']}
      actions={
        <Bouton
          variante="secondaire"
          icone={<Download className="h-4 w-4" />}
          disabled={!requete.data?.length}
          onClick={() =>
            exporterCsv(
              `solvabilite-${classId}`,
              [
                { entete: 'Matricule', valeur: (l: LigneSituationClasse) => l.matricule },
                { entete: 'Élève', valeur: (l: LigneSituationClasse) => l.fullName },
                { entete: 'Dû', valeur: (l: LigneSituationClasse) => l.due },
                { entete: 'Payé', valeur: (l: LigneSituationClasse) => l.paid },
                { entete: 'Solde', valeur: (l: LigneSituationClasse) => l.balance },
                { entete: 'Statut', valeur: (l: LigneSituationClasse) => LIBELLE_STATUT_FINANCIER[l.status] },
                { entete: 'En retard', valeur: (l: LigneSituationClasse) => (l.isOverdue ? 'Oui' : 'Non') },
              ],
              requete.data ?? [],
            )
          }
        >
          Exporter
        </Bouton>
      }
      filtres={<SelecteurClasse valeur={classId} onChange={setClassId} requis />}
      chargement={Boolean(classId) && requete.isLoading}
      erreur={classId ? requete.error : undefined}
      lignes={classId ? requete.data : []}
      colonnes={colonnes}
      cleLigne={(l) => l.studentId}
      onLigneCliquee={(l) => naviguer(`/eleves/${l.studentId}`)}
      vide={{
        titre: classId ? 'Aucune inscription dans cette classe' : 'Choisissez une classe',
        description: classId
          ? "Aucun élève n'est actuellement inscrit dans cette classe."
          : 'La situation financière se calcule pour chaque élève inscrit.',
        icone: <Wallet className="h-8 w-8" />,
      }}
    />
  )
}
