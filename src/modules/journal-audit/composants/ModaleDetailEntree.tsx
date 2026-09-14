import { Modale } from '../../../ui'
import { GrilleInfos, LigneInfo, formaterDateHeure } from '../../../communs'
import type { EntreeAudit } from '../../../socle/modeles/administration'
import { LIBELLE_ACTION } from '../api'
import { ComparaisonValeurs } from './ComparaisonValeurs'

interface Props {
  entree: EntreeAudit | null
  onFermer: () => void
}

/**
 * Consultation seule. Aucun bouton de modification ni de suppression n'est
 * présent, et il ne doit jamais y en avoir : RG-15.
 */
export function ModaleDetailEntree({ entree, onFermer }: Props) {
  return (
    <Modale
      ouverte={entree !== null}
      onFermer={onFermer}
      titre={entree ? LIBELLE_ACTION[entree.action] : ''}
      taille="lg"
    >
      {entree && (
        <div className="flex flex-col gap-5">
          <GrilleInfos colonnes={3}>
            <LigneInfo libelle="Auteur">{entree.userLabel}</LigneInfo>
            <LigneInfo libelle="Date et heure">{formaterDateHeure(entree.createdAt)}</LigneInfo>
            <LigneInfo libelle="Adresse IP">{entree.ipAddress}</LigneInfo>
            <LigneInfo libelle="Type d'objet">{entree.entityType}</LigneInfo>
            <LigneInfo libelle="Objet concerné">{entree.entityLabel}</LigneInfo>
            <LigneInfo libelle="Identifiant">
              <code className="text-xs">{entree.entityId}</code>
            </LigneInfo>
          </GrilleInfos>

          <div>
            <h3 className="text-ink mb-2 text-sm font-semibold">Valeurs</h3>
            <ComparaisonValeurs avant={entree.before} apres={entree.after} />
          </div>

          <p className="text-muted text-xs">
            Cette entrée est en lecture seule et ne peut être ni modifiée ni supprimée, quel que soit le rôle
            de l'utilisateur connecté.
          </p>
        </div>
      )}
    </Modale>
  )
}
