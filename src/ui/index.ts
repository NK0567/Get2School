/**
 * Design system Get2School · PROPRIETAIRE : Boris
 *
 * Les trois lots importent uniquement depuis ce point d'entree :
 *   import { Bouton, Tableau, EtatVide } from '@/ui'
 *
 * Personne ne recode un bouton. Un composant manquant se demande a
 * l'integrateur, il ne se cree pas dans un dossier de module.
 */
export { cn } from './cn'
export { Bouton } from './Bouton'
export { Champ } from './Champ'
export { Selecteur } from './Selecteur'
export type { OptionSelecteur } from './Selecteur'
export { Badge } from './Badge'
export type { TonBadge } from './Badge'
export { Tableau } from './Tableau'
export type { Colonne } from './Tableau'
export { Modale } from './Modale'
export { DialogueConfirmation } from './DialogueConfirmation'
export { FournisseurToast, useToast } from './Toast'
export { EnteteDePage } from './EnteteDePage'
export { EtatVide } from './EtatVide'
export { Squelette, SqueletteTableau } from './Squelette'
export { CarteStat } from './CarteStat'
