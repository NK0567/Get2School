import { Badge } from '../../ui'
import type { TonBadge } from '../../ui'

/**
 * Correspondance statut / couleur / libellé · PROPRIÉTAIRE : Boris
 *
 * Imposée par la charte graphique. Aucun module ne recode cette table :
 * si un statut manque, on l'ajoute ici, pas ailleurs. C'est ce qui garantit
 * qu'un élève « Partiel » a la même couleur dans les trois lots.
 */
const TABLE: Record<string, { ton: TonBadge; libelle: string }> = {
  /* Situation financière · lot B */
  PAID: { ton: 'succes', libelle: 'Solvable' },
  PARTIAL: { ton: 'alerte', libelle: 'Partiel' },
  UNPAID: { ton: 'danger', libelle: 'Insolvable' },
  EXEMPT: { ton: 'info', libelle: 'Exonéré' },

  /* Présence · lot C */
  PRESENT: { ton: 'succes', libelle: 'Présent' },
  ABSENCE_JUSTIFIEE: { ton: 'alerte', libelle: 'Absence justifiée' },
  ABSENCE: { ton: 'danger', libelle: 'Absence' },
  LATE: { ton: 'alerte', libelle: 'Retard' },

  /* Risque académique · lot C */
  LOW: { ton: 'succes', libelle: 'Faible' },
  MEDIUM: { ton: 'alerte', libelle: 'Moyen' },
  HIGH: { ton: 'danger', libelle: 'Élevé' },

  /* Note · lot C */
  VALID: { ton: 'succes', libelle: 'Valide' },
  PENALIZED: { ton: 'danger', libelle: 'Sanctionnée' },

  /* Évaluation · lot C */
  DRAFT: { ton: 'neutre', libelle: 'Brouillon' },
  PUBLISHED: { ton: 'succes', libelle: 'Publiée' },
  LOCKED: { ton: 'info', libelle: 'Verrouillée' },

  /* Année scolaire · lot A */
  OPEN: { ton: 'succes', libelle: 'Ouverte' },
  CLOSED: { ton: 'neutre', libelle: 'Clôturée' },

  /* Compte utilisateur · lot A */
  ACTIF: { ton: 'succes', libelle: 'Actif' },
  INACTIF: { ton: 'neutre', libelle: 'Désactivé' },

  /* Établissement · lot A */
  PENDING: { ton: 'alerte', libelle: 'En attente' },
  ACTIVE: { ton: 'succes', libelle: 'Actif' },
  SUSPENDED: { ton: 'danger', libelle: 'Suspendu' },

  /* Inscription · lot B */
  TRANSFERRED: { ton: 'info', libelle: 'Transférée' },
  DROPPED: { ton: 'neutre', libelle: 'Abandon' },
  COMPLETED: { ton: 'succes', libelle: 'Terminée' },

  /* Document · lot A */
  GENERATED: { ton: 'succes', libelle: 'Généré' },
  FAILED: { ton: 'danger', libelle: 'Échec' },
  CANCELLED: { ton: 'neutre', libelle: 'Annulé' },
}

export function BadgeStatut({ valeur, libelle }: { valeur: string; libelle?: string }) {
  const entree = TABLE[valeur]
  if (!entree) return <Badge ton="neutre">{libelle ?? valeur}</Badge>
  return <Badge ton={entree.ton}>{libelle ?? entree.libelle}</Badge>
}
