/**
 * Design system Get2School · PROPRIETAIRE : Boris
 *
 * Les trois lots importent uniquement depuis ce point d'entree :
 *   import { Bouton, Tableau, EtatVide } from '@/ui'
 *
 * Personne ne recode un bouton. Un composant manquant se demande a
 * l'integrateur, il ne se créé pas dans un dossier de module.
 */
export { cn } from './cn'

/* Saisie */
export { Bouton } from './Bouton'
export { Champ } from './Champ'
export { ZoneTexte } from './ZoneTexte'
export { Selecteur } from './Selecteur'
export type { OptionSelecteur } from './Selecteur'
export { CaseACocher } from './CaseACocher'
export { Interrupteur } from './Interrupteur'

/* Affichage */
export { Badge } from './Badge'
export type { TonBadge } from './Badge'
export { Alerte } from './Alerte'
export { Avatar } from './Avatar'
export { Tableau } from './Tableau'
export type { Colonne, EtatTri } from './Tableau'
export { MenuActions } from './MenuActions'
export type { ActionMenu } from './MenuActions'
export { CarteStat } from './CarteStat'

/* Structure */
export { EnteteDePage } from './EnteteDePage'
export { EtatVide } from './EtatVide'
export { Squelette, SqueletteTableau } from './Squelette'

/* Superpositions */
export { Modale } from './Modale'
export { DialogueConfirmation } from './DialogueConfirmation'
export { FournisseurToast, useToast } from './Toast'
