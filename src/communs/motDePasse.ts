/**
 * Politique de mot de passe · PROPRIÉTAIRE : Boris
 *
 * Cette politique est appliquée à l'inscription, à la réinitialisation et au
 * changement de mot de passe. Elle est dupliquée côté Spring Boot : le
 * navigateur guide l'utilisateur, le serveur décide.
 */

export const LONGUEUR_MINIMALE = 10

export interface ExigenceMotDePasse {
  cle: string
  libelle: string
  satisfaite: (valeur: string, contexte?: ContexteMotDePasse) => boolean
}

export interface ContexteMotDePasse {
  /** Interdit de réutiliser son adresse ou son nom dans le mot de passe. */
  email?: string
  nom?: string
  prenom?: string
}

export const EXIGENCES: ExigenceMotDePasse[] = [
  {
    cle: 'longueur',
    libelle: `Au moins ${LONGUEUR_MINIMALE} caractères`,
    satisfaite: (v) => v.length >= LONGUEUR_MINIMALE,
  },
  {
    cle: 'minuscule',
    libelle: 'Une lettre minuscule',
    satisfaite: (v) => /[a-zà-ÿ]/.test(v),
  },
  {
    cle: 'majuscule',
    libelle: 'Une lettre majuscule',
    satisfaite: (v) => /[A-ZÀ-Ÿ]/.test(v),
  },
  {
    cle: 'chiffre',
    libelle: 'Un chiffre',
    satisfaite: (v) => /\d/.test(v),
  },
  {
    cle: 'special',
    libelle: 'Un caractère spécial',
    satisfaite: (v) => /[^\w\sÀ-ÿ]/.test(v),
  },
  {
    cle: 'personnel',
    libelle: 'Ne reprend ni votre nom ni votre adresse',
    satisfaite: (v, contexte) => {
      if (!v) return false
      const minuscule = v.toLowerCase()
      const interdits = [contexte?.email?.split('@')[0], contexte?.nom, contexte?.prenom].filter(
        (x): x is string => Boolean(x) && (x as string).length >= 3,
      )
      return !interdits.some((mot) => minuscule.includes(mot.toLowerCase()))
    },
  },
]

export interface EvaluationMotDePasse {
  satisfaites: string[]
  manquantes: ExigenceMotDePasse[]
  valide: boolean
  /** 0 à 4 : sert uniquement à l'affichage de la jauge. */
  force: number
}

export function evaluerMotDePasse(valeur: string, contexte?: ContexteMotDePasse): EvaluationMotDePasse {
  const satisfaites: string[] = []
  const manquantes: ExigenceMotDePasse[] = []

  for (const exigence of EXIGENCES) {
    if (exigence.satisfaite(valeur, contexte)) satisfaites.push(exigence.cle)
    else manquantes.push(exigence)
  }

  const valide = manquantes.length === 0
  let force = Math.min(4, Math.floor((satisfaites.length / EXIGENCES.length) * 4))
  if (valide && valeur.length >= 14) force = 4

  return { satisfaites, manquantes, valide, force }
}

export const LIBELLE_FORCE = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent']
