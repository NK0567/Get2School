import { Badge } from '../../ui'
import type { TonBadge } from '../../ui'

/**
 * Correspondance statut / couleur / libelle · PROPRIETAIRE : Boris
 *
 * Imposee par la charte graphique. Aucun module ne recode cette table :
 * si un statut manque, on l'ajoute ici, pas ailleurs. C'est ce qui garantit
 * qu'un eleve « Partiel » a la meme couleur dans les trois lots.
 */
const TABLE: Record<string, { ton: TonBadge; libelle: string }> = {
  /* Situation financiere · lot B */
  PAID: { ton: 'succes', libelle: 'Solvable' },
  PARTIAL: { ton: 'alerte', libelle: 'Partiel' },
  UNPAID: { ton: 'danger', libelle: 'Insolvable' },
  EXEMPT: { ton: 'info', libelle: 'Exonere' },

  /* Presence · lot C */
  PRESENT: { ton: 'succes', libelle: 'Present' },
  ABSENCE_JUSTIFIEE: { ton: 'alerte', libelle: 'Absence justifiee' },
  ABSENCE: { ton: 'danger', libelle: 'Absence' },
  LATE: { ton: 'alerte', libelle: 'Retard' },

  /* Risque academique · lot C */
  LOW: { ton: 'succes', libelle: 'Faible' },
  MEDIUM: { ton: 'alerte', libelle: 'Moyen' },
  HIGH: { ton: 'danger', libelle: 'Eleve' },

  /* Note · lot C */
  VALID: { ton: 'succes', libelle: 'Valide' },
  PENALIZED: { ton: 'danger', libelle: 'Sanctionnee' },

  /* Evaluation · lot C */
  DRAFT: { ton: 'neutre', libelle: 'Brouillon' },
  PUBLISHED: { ton: 'succes', libelle: 'Publiee' },
  LOCKED: { ton: 'info', libelle: 'Verrouillee' },

  /* Annee scolaire · lot A */
  OPEN: { ton: 'succes', libelle: 'Ouverte' },
  CLOSED: { ton: 'neutre', libelle: 'Cloturee' },

  /* Compte utilisateur · lot A */
  ACTIF: { ton: 'succes', libelle: 'Actif' },
  INACTIF: { ton: 'neutre', libelle: 'Desactive' },

  /* Etablissement · lot A */
  PENDING: { ton: 'alerte', libelle: 'En attente' },
  ACTIVE: { ton: 'succes', libelle: 'Actif' },
  SUSPENDED: { ton: 'danger', libelle: 'Suspendu' },

  /* Inscription · lot B */
  TRANSFERRED: { ton: 'info', libelle: 'Transferee' },
  DROPPED: { ton: 'neutre', libelle: 'Abandon' },
  COMPLETED: { ton: 'succes', libelle: 'Terminee' },

  /* Document · lot A */
  GENERATED: { ton: 'succes', libelle: 'Genere' },
  FAILED: { ton: 'danger', libelle: 'Echec' },
  CANCELLED: { ton: 'neutre', libelle: 'Annule' },
}

export function BadgeStatut({ valeur, libelle }: { valeur: string; libelle?: string }) {
  const entree = TABLE[valeur]
  if (!entree) return <Badge ton="neutre">{libelle ?? valeur}</Badge>
  return <Badge ton={entree.ton}>{libelle ?? entree.libelle}</Badge>
}
