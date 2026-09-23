/**
 * Moteur de calcul des notes · lot C (Fabrice)
 *
 * Fonctions pures, sans accès au stockage : elles reçoivent leurs données en
 * entrée et renvoient un résultat, rien d'autre. C'est ce qui les rend
 * transposables telles quelles en Java côté Spring Boot, et testables sans
 * navigateur ni simulation.
 *
 * RG-06  une note est comprise entre 0 et le barème de l'évaluation.
 * RG-09  le calcul ignore les évaluations non publiées (filtré en amont,
 *        avant d'appeler ces fonctions : elles ne reçoivent que des notes
 *        d'évaluations déjà publiées).
 * RG-10  deux élèves à moyenne strictement égale ont le même rang, et le
 *        rang suivant est sauté (1, 2, 2, 4).
 *
 * Aucun arrondi intermédiaire : on calcule en pleine précision et on
 * n'arrondit qu'à l'affichage, avec formaterMoyenne(). Arrondir la moyenne de
 * chaque matière avant de calculer la moyenne générale introduirait des
 * écarts qu'un contrôle à la calculatrice détecterait.
 */
import type { Note } from '../../socle/modeles/academique'

export interface NoteAvecCoefficient {
  note: Note
  coefficientEvaluation: number
}

/**
 * Moyenne d'un élève dans une matière, sur une période.
 *
 * `null` si aucune note valide n'existe : jamais 0. Un tableau qui afficherait
 * 0,00 pour une matière non encore notée ferait perdre toute confiance dans
 * les chiffres.
 */
/**
 * RG-clarifiée (retour direct du responsable métier) : une note sanctionnée
 * compte TOUJOURS comme un zéro, coefficient inclus au dénominateur. Ce
 * n'est pas un réglage d'établissement : c'est la définition même de « cet
 * élève est sanctionné ». Une absence avec motif valable (maladie...) est un
 * cas différent : elle se déclare séparément (statut ABSENT) et sort
 * entièrement du calcul, coefficient compris — ni comptée, ni comptée à
 * zéro. Les deux boutons dans la grille de saisie sont donc bien deux
 * décisions distinctes, jamais une seule case à cocher :
 *   - « Absent » (motif valable, l'enseignant ne coche rien d'autre)
 *     → la note n'existe pas pour le calcul.
 *   - « Sanctionner » (pas de motif valable, activé explicitement)
 *     → la note vaut 0, le coefficient est compté.
 */
export function moyenneMatiere(notes: NoteAvecCoefficient[]): number | null {
  let numerateur = 0
  let denominateur = 0

  for (const { note, coefficientEvaluation } of notes) {
    if (note.status === 'ABSENT') continue

    if (note.status === 'PENALIZED') {
      // La note vaut 0, son coefficient reste au dénominateur : c'est la
      // seule signification possible d'une sanction, non configurable.
      denominateur += coefficientEvaluation
      continue
    }

    if (note.value === null) continue
    numerateur += note.value * coefficientEvaluation
    denominateur += coefficientEvaluation
  }

  if (denominateur === 0) return null
  return numerateur / denominateur
}

export interface MatierePourMoyenneGenerale {
  moyenne: number | null
  coefficientMatiere: number
}

/** Moyenne générale : seules les matières ayant une moyenne non nulle entrent dans le calcul. */
export function moyenneGenerale(matieres: MatierePourMoyenneGenerale[]): number | null {
  let numerateur = 0
  let denominateur = 0

  for (const { moyenne, coefficientMatiere } of matieres) {
    if (moyenne === null) continue
    numerateur += moyenne * coefficientMatiere
    denominateur += coefficientMatiere
  }

  if (denominateur === 0) return null
  return numerateur / denominateur
}

export interface EleveClasse {
  enrollmentId: string
  moyenne: number | null
}

export interface RangEleve extends EleveClasse {
  rang: number | null
}

/**
 * Classement d'une classe. Tri décroissant, ex aequo au même rang, rang
 * suivant sauté (RG-10) : 1, 2, 2, 4 — jamais de départage arbitraire.
 * Les élèves sans moyenne (null) ne sont pas classés.
 */
export function classerEleves(eleves: EleveClasse[]): RangEleve[] {
  const notes = eleves.filter((e) => e.moyenne !== null)
  const sansNote = eleves.filter((e) => e.moyenne === null)

  const tries = [...notes].sort((a, b) => (b.moyenne as number) - (a.moyenne as number))

  const classes: RangEleve[] = []
  let rangCourant = 0
  let precedente: number | null = null

  tries.forEach((eleve, index) => {
    if (eleve.moyenne !== precedente) {
      rangCourant = index + 1
      precedente = eleve.moyenne
    }
    classes.push({ ...eleve, rang: rangCourant })
  })

  return [...classes, ...sansNote.map((e) => ({ ...e, rang: null }))]
}

/** Pourcentage d'élèves dont la moyenne générale atteint la moyenne de passage. */
export function tauxReussite(moyennes: (number | null)[], moyenneDePassage: number): number | null {
  const valides = moyennes.filter((m): m is number => m !== null)
  if (valides.length === 0) return null
  return (valides.filter((m) => m >= moyenneDePassage).length / valides.length) * 100
}

const SEUILS_APPRECIATION: { seuil: number; libelle: string }[] = [
  { seuil: 16, libelle: 'Excellent' },
  { seuil: 14, libelle: 'Très bien' },
  { seuil: 12, libelle: 'Bien' },
  { seuil: 10, libelle: 'Assez bien' },
  { seuil: 8, libelle: 'Insuffisant' },
]

/** Appréciation automatique à partir d'une moyenne sur 20. Seuils par défaut, configurables plus tard. */
export function appreciation(moyenne: number | null): string {
  if (moyenne === null) return '—'
  for (const { seuil, libelle } of SEUILS_APPRECIATION) {
    if (moyenne >= seuil) return libelle
  }
  return 'Très insuffisant'
}

/** RG-06 : la note doit rester dans le barème. */
export function noteDansLeBareme(valeur: number, bareme: number): boolean {
  return valeur >= 0 && valeur <= bareme
}

/**
 * Indicateur de risque académique. Fonction pure, identique à celle utilisée
 * pour les moyennes : testée à part, réutilisée telle quelle côté serveur.
 *
 * RG-16 : ce score signale un dossier à examiner, il ne prononce et
 * n'entraîne aucune décision. Toute interface qui l'affiche doit porter un
 * bandeau qui le rappelle — voir modules/analyses/pages/ElevesARisque.tsx.
 *
 * Les quatre poids sont ceux réglés par l'établissement
 * (settings.riskWeights) et n'ont de sens ensemble que s'ils totalisent 100,
 * contrôle déjà fait à l'écran des paramètres (ParametresEtablissement.tsx).
 */
export interface PoidsRisque {
  average: number
  trend: number
  absence: number
  discipline: number
}

export interface EntreesRisque {
  /** Moyenne générale de la période courante, ou null si aucune note. */
  moyenneGenerale: number | null
  /** Vrai si la moyenne de cette période est inférieure à celle de la période précédente. */
  tendanceNegative: boolean
  /** Fraction de jours d'absence sur la période, entre 0 et 1. */
  tauxAbsence: number
  /** Nombre d'événements disciplinaires sur la période. */
  nombreIncidents: number
}

export interface ResultatRisque {
  score: number
  niveau: 'LOW' | 'MEDIUM' | 'HIGH'
  facteurs: PoidsRisque
}

const SATURATION_ABSENCE = 0.2 // 20 % de jours d'absence sature la composante
const SATURATION_DISCIPLINE = 5 // 5 incidents saturent la composante

export function scoreRisque(entrees: EntreesRisque, poids: PoidsRisque): ResultatRisque {
  const composanteMoyenne =
    entrees.moyenneGenerale === null
      ? 0 // aucune note disponible : on ne peut rien reprocher à l'élève sur ce facteur
      : poids.average * (1 - Math.min(entrees.moyenneGenerale, 20) / 20)

  const composanteTendance = poids.trend * (entrees.tendanceNegative ? 1 : 0)
  const composanteAbsence = poids.absence * Math.min(entrees.tauxAbsence / SATURATION_ABSENCE, 1)
  const composanteDiscipline = poids.discipline * Math.min(entrees.nombreIncidents / SATURATION_DISCIPLINE, 1)

  const score = composanteMoyenne + composanteTendance + composanteAbsence + composanteDiscipline

  const niveau: ResultatRisque['niveau'] = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW'

  return {
    score,
    niveau,
    facteurs: {
      average: composanteMoyenne,
      trend: composanteTendance,
      absence: composanteAbsence,
      discipline: composanteDiscipline,
    },
  }
}
