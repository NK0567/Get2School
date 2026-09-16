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

export type PolitiqueSanction = 'EXCLUDE_COEFFICIENT' | 'COUNT_AS_ZERO'

/**
 * Moyenne d'un élève dans une matière, sur une période.
 *
 * `null` si aucune note valide n'existe : jamais 0. Un tableau qui afficherait
 * 0,00 pour une matière non encore notée ferait perdre toute confiance dans
 * les chiffres.
 */
export function moyenneMatiere(notes: NoteAvecCoefficient[], politique: PolitiqueSanction): number | null {
  let numerateur = 0
  let denominateur = 0

  for (const { note, coefficientEvaluation } of notes) {
    if (note.status === 'ABSENT') continue

    if (note.status === 'PENALIZED') {
      if (politique === 'EXCLUDE_COEFFICIENT') continue
      // COUNT_AS_ZERO : la note vaut 0, son coefficient reste au dénominateur.
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
