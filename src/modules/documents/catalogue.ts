/**
 * Catalogue des documents produits par Get2School · lot A (Boris)
 *
 * Le Centre documentaire est le générateur UNIQUE de la plateforme. Aucun
 * autre module ne produit de fichier : les lots B et C y envoient un type et
 * des filtres. Cela garantit qu'un bulletin imprimé depuis la fiche élève et
 * un bulletin imprimé en lot sont rigoureusement identiques.
 */
import type { Role } from '../../socle/modeles/communs'

export type CibleDocument = 'STUDENT' | 'CLASS' | 'LEVEL' | 'ESTABLISHMENT'

export interface TypeDocument {
  code: string
  libelle: string
  categorie: string
  cible: CibleDocument
  /** Rôles autorisés à générer ce type. Le serveur applique la même règle. */
  roles: Role[]
  /** Document rattaché à une période et non à la seule année scolaire. */
  parPeriode?: boolean
  /** Fourni par un autre lot : le Centre documentaire lit ses données. */
  fourniPar?: 'Scolarité' | 'Académique' | 'Finance'
}

export const TYPES_DOCUMENT: TypeDocument[] = [
  {
    code: 'CERTIFICAT_SCOLARITE',
    libelle: 'Certificat de scolarité',
    categorie: 'Élèves',
    cible: 'STUDENT',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'SECRETARY'],
    fourniPar: 'Scolarité',
  },
  {
    code: 'CARTE_SCOLAIRE',
    libelle: 'Carte scolaire',
    categorie: 'Élèves',
    cible: 'STUDENT',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'SECRETARY'],
    fourniPar: 'Scolarité',
  },
  {
    code: 'FICHE_ELEVE',
    libelle: 'Fiche individuelle',
    categorie: 'Élèves',
    cible: 'STUDENT',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'SECRETARY'],
    fourniPar: 'Scolarité',
  },
  {
    code: 'LISTE_CLASSE',
    libelle: 'Liste de classe',
    categorie: 'Élèves',
    cible: 'CLASS',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'SECRETARY', 'ACADEMIC_HEAD'],
    fourniPar: 'Scolarité',
  },
  {
    code: 'BULLETIN',
    libelle: 'Bulletin de notes',
    categorie: 'Académique',
    cible: 'STUDENT',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACADEMIC_HEAD'],
    parPeriode: true,
    fourniPar: 'Académique',
  },
  {
    code: 'RELEVE_NOTES',
    libelle: 'Relevé de notes',
    categorie: 'Académique',
    cible: 'STUDENT',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACADEMIC_HEAD'],
    parPeriode: true,
    fourniPar: 'Académique',
  },
  {
    code: 'PROCES_VERBAL',
    libelle: 'Procès-verbal de classe',
    categorie: 'Académique',
    cible: 'CLASS',
    roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD'],
    parPeriode: true,
    fourniPar: 'Académique',
  },
  {
    code: 'RECU_PAIEMENT',
    libelle: 'Reçu de paiement',
    categorie: 'Finance',
    cible: 'STUDENT',
    roles: ['SCHOOL_ADMIN', 'ACCOUNTANT'],
    fourniPar: 'Finance',
  },
  {
    code: 'LISTE_SOLVABILITE',
    libelle: 'Liste de solvabilité',
    categorie: 'Finance',
    cible: 'CLASS',
    roles: ['SCHOOL_ADMIN', 'ACCOUNTANT'],
    fourniPar: 'Finance',
  },
  {
    code: 'ETAT_EFFECTIFS',
    libelle: 'État des effectifs',
    categorie: 'Administratif',
    cible: 'ESTABLISHMENT',
    roles: ['SCHOOL_ADMIN', 'ADMIN'],
  },
  {
    code: 'RAPPORT_DISCIPLINAIRE',
    libelle: 'Rapport disciplinaire',
    categorie: 'Administratif',
    cible: 'CLASS',
    roles: ['SCHOOL_ADMIN', 'ACADEMIC_HEAD'],
    parPeriode: true,
    fourniPar: 'Académique',
  },
]

export function typeDocument(code: string) {
  return TYPES_DOCUMENT.find((t) => t.code === code)
}

export function libelleType(code: string) {
  return typeDocument(code)?.libelle ?? code
}

export const CATEGORIES = [...new Set(TYPES_DOCUMENT.map((t) => t.categorie))]

export const LIBELLE_CIBLE: Record<CibleDocument, string> = {
  STUDENT: 'Un élève',
  CLASS: 'Une classe',
  LEVEL: 'Un niveau',
  ESTABLISHMENT: "L'établissement",
}
