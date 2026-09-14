import { useState } from 'react'
import { Download, ScrollText, ShieldAlert } from 'lucide-react'
import { Badge, Bouton, Champ, Selecteur } from '../../../ui'
import type { Colonne } from '../../../ui'
import { GabaritListe, exporterCsv, formaterDateHeure, nomFichierDate, usePagination } from '../../../communs'
import type { ActionAudit, EntreeAudit } from '../../../socle/modeles/administration'
import { ACTIONS_CRITIQUES, CATEGORIES_ACTION, LIBELLE_ACTION } from '../api'
import { useJournalAudit } from '../hooks/useJournalAudit'
import { ModaleDetailEntree } from '../composants/ModaleDetailEntree'

const OPTIONS_ACTION = CATEGORIES_ACTION.flatMap((categorie) =>
  categorie.actions.map((action) => ({
    valeur: action,
    libelle: `${categorie.libelle} · ${LIBELLE_ACTION[action]}`,
  })),
)

export default function JournalAudit() {
  const { page, taille, setPage, reinitialiser } = usePagination(15)
  const [action, setAction] = useState<ActionAudit | ''>('')
  const [du, setDu] = useState('')
  const [au, setAu] = useState('')
  const [detail, setDetail] = useState<EntreeAudit | null>(null)

  const requete = useJournalAudit({ action, du, au, page, taille })
  const entrees = requete.data?.contenu ?? []

  const colonnes: Colonne<EntreeAudit>[] = [
    {
      cle: 'date',
      entete: 'Date et heure',
      className: 'w-44',
      rendu: (e) => <span className="text-muted tabular-nums">{formaterDateHeure(e.createdAt)}</span>,
    },
    {
      cle: 'action',
      entete: 'Opération',
      rendu: (e) => (
        <span className="inline-flex items-center gap-2">
          {ACTIONS_CRITIQUES.includes(e.action) && (
            <ShieldAlert className="text-warning h-3.5 w-3.5 shrink-0" />
          )}
          <span className="font-medium">{LIBELLE_ACTION[e.action]}</span>
        </span>
      ),
    },
    {
      cle: 'objet',
      entete: 'Objet concerné',
      rendu: (e) => (
        <div>
          <div>{e.entityLabel}</div>
          <div className="text-muted text-xs">{e.entityType}</div>
        </div>
      ),
    },
    { cle: 'auteur', entete: 'Auteur', rendu: (e) => e.userLabel },
    {
      cle: 'valeurs',
      entete: '',
      className: 'text-right w-28',
      rendu: (e) =>
        e.before || e.after ? (
          <Badge ton="info">Voir les valeurs</Badge>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Journal d'audit"
        sousTitre="Registre des opérations sensibles. Consultation seule."
        filAriane={['Administration']}
        actions={
          <Bouton
            variante="secondaire"
            icone={<Download className="h-4 w-4" />}
            disabled={entrees.length === 0}
            onClick={() =>
              exporterCsv(
                nomFichierDate('journal-audit'),
                [
                  { entete: 'Date', valeur: (e: EntreeAudit) => formaterDateHeure(e.createdAt) },
                  { entete: 'Opération', valeur: (e: EntreeAudit) => LIBELLE_ACTION[e.action] },
                  { entete: 'Code', valeur: (e: EntreeAudit) => e.action },
                  { entete: 'Auteur', valeur: (e: EntreeAudit) => e.userLabel },
                  { entete: "Type d'objet", valeur: (e: EntreeAudit) => e.entityType },
                  { entete: 'Objet', valeur: (e: EntreeAudit) => e.entityLabel },
                  { entete: 'Identifiant', valeur: (e: EntreeAudit) => e.entityId },
                  { entete: 'Adresse IP', valeur: (e: EntreeAudit) => e.ipAddress },
                  { entete: 'Avant', valeur: (e: EntreeAudit) => JSON.stringify(e.before ?? '') },
                  { entete: 'Après', valeur: (e: EntreeAudit) => JSON.stringify(e.after ?? '') },
                ],
                entrees,
              )
            }
          >
            Exporter
          </Bouton>
        }
        filtres={
          <>
            <Selecteur
              className="w-80"
              value={action}
              onChange={(e) => {
                setAction(e.target.value as ActionAudit | '')
                reinitialiser()
              }}
              placeholder="Toutes les opérations"
              options={OPTIONS_ACTION}
            />
            <Champ
              libelle="Du"
              type="date"
              value={du}
              onChange={(e) => {
                setDu(e.target.value)
                reinitialiser()
              }}
            />
            <Champ
              libelle="Au"
              type="date"
              value={au}
              onChange={(e) => {
                setAu(e.target.value)
                reinitialiser()
              }}
            />
            {(action || du || au) && (
              <Bouton
                variante="fantome"
                onClick={() => {
                  setAction('')
                  setDu('')
                  setAu('')
                  reinitialiser()
                }}
              >
                Effacer les filtres
              </Bouton>
            )}
          </>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={entrees}
        colonnes={colonnes}
        cleLigne={(e) => e.id}
        onLigneCliquee={setDetail}
        vide={{
          titre: 'Aucune opération ne correspond à ces critères',
          description: "Élargissez la période ou retirez le filtre d'opération.",
          icone: <ScrollText className="h-8 w-8" />,
        }}
        pagination={{ page, taille, total: requete.data?.total ?? 0, onChange: setPage }}
      />

      <ModaleDetailEntree entree={detail} onFermer={() => setDetail(null)} />
    </>
  )
}
