/**
 * Base commune aux trois lots · PROPRIETAIRE : Boris
 *
 * Point d'entree unique :
 *   import { GabaritListe, formaterMontant, BadgeStatut } from '@/communs'
 *
 * Tout ce qui est utilise par plus d'un lot vit ici. Si vous ecrivez une
 * fonction que les autres pourraient reutiliser, demandez son ajout plutot
 * que de la garder dans votre module.
 */

/* Formatage, validation, export */
export * from './formats'
export * from './validations'
export { exporterCsv, nomFichierDate } from './exports'
export type { ColonneExport } from './exports'

/* Hooks */
export { useDebounce } from './hooks/useDebounce'
export { usePagination } from './hooks/usePagination'
export { useConfirmation } from './hooks/useConfirmation'
export { useTri } from './hooks/useTri'

/* Composants */
export { Pagination } from './composants/Pagination'
export { ChampRecherche } from './composants/ChampRecherche'
export { LigneInfo, GrilleInfos } from './composants/LigneInfo'
export { BadgeStatut } from './composants/BadgeStatut'
export { FrontiereErreur } from './composants/FrontiereErreur'

/* Selecteurs metier partages */
export { SelecteurClasse } from './selecteurs/SelecteurClasse'
export { SelecteurMatiere } from './selecteurs/SelecteurMatiere'
export { SelecteurEnseignant } from './selecteurs/SelecteurEnseignant'
export { SelecteurPeriode } from './selecteurs/SelecteurPeriode'

/* Graphiques */
export { GraphiqueLignes } from './graphiques/GraphiqueLignes'
export type { SerieGraphique } from './graphiques/GraphiqueLignes'
export { GraphiqueBarres } from './graphiques/GraphiqueBarres'

/* Gabarits de page */
export { GabaritListe } from './gabarits/GabaritListe'
export { GabaritFiche } from './gabarits/GabaritFiche'
export type { OngletFiche } from './gabarits/GabaritFiche'
export { GabaritDocument } from './gabarits/GabaritDocument'
