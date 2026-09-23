/**
 * Génération automatique d'emploi du temps · lot B (Alida)
 *
 * Algorithme glouton aléatoire : pour chaque couple (classe, matière,
 * enseignant) issu des affectations, on tente de le placer sur un créneau
 * tiré au hasard parmi un ensemble de créneaux possibles, en rejetant tout
 * essai qui entre en conflit — réutilise le détecteur de conflits déjà
 * construit et testé (calculs.ts), jamais une seconde règle réécrite en
 * double. Après un nombre d'essais raisonnable, un couple qui ne trouve
 * aucun créneau libre est signalé en échec, jamais silencieusement ignoré :
 * un emploi du temps automatique peut authentiquement échouer à tout
 * caser selon le nombre de salles et de disponibilités.
 *
 * Ce n'est pas un solveur de contraintes complet (pas de recherche avec
 * retour arrière global) : c'est un compromis pragmatique, honnête sur ses
 * limites, qui documente ses échecs plutôt que de les masquer.
 */
import type { CreneauEmploiDuTemps, Salle } from '../../socle/modeles/scolarite'
import { detecterConflits } from './calculs'

const JOURS = [1, 2, 3, 4, 5, 6]
const HEURES_DEBUT = [7, 8, 9, 10, 11, 13, 14, 15, 16]
const DUREE_HEURES = 1
const TENTATIVES_MAX = 60

export interface AffectationAPlacer {
  classId: string
  subjectId: string
  teacherId: string
}

export interface EchecPlacement {
  affectation: AffectationAPlacer
  raison: string
}

export interface ResultatGeneration {
  crees: CreneauEmploiDuTemps[]
  echecs: EchecPlacement[]
}

function formaterHeure(h: number): string {
  return `${String(h).padStart(2, '0')}:00`
}

/**
 * `alea` est injectable pour des tests reproductibles : par défaut
 * Math.random, mais un test peut passer une suite déterministe.
 */
export function genererEmploiDuTempsAleatoire(
  affectations: AffectationAPlacer[],
  salles: Salle[],
  existants: CreneauEmploiDuTemps[],
  fabriquerId: () => string,
  contexte: { establishmentId: string; schoolYearId: string },
  alea: () => number = Math.random,
): ResultatGeneration {
  const sallesDisponibles = salles.filter((s) => s.isAvailable)
  if (sallesDisponibles.length === 0) {
    return {
      crees: [],
      echecs: affectations.map((a) => ({
        affectation: a,
        raison: "Aucune salle disponible dans l'établissement.",
      })),
    }
  }

  const choisir = <T>(liste: T[]): T => liste[Math.floor(alea() * liste.length)]

  const poses: CreneauEmploiDuTemps[] = [...existants]
  const echecs: EchecPlacement[] = []
  const crees: CreneauEmploiDuTemps[] = []

  // Ordre mélangé : un ordre fixe favoriserait systématiquement les mêmes
  // matières placées en premier, au détriment des dernières de la liste.
  const melangees = [...affectations].sort(() => alea() - 0.5)

  for (const affectation of melangees) {
    let place = false

    for (let tentative = 0; tentative < TENTATIVES_MAX; tentative += 1) {
      const jour = choisir(JOURS)
      const debut = choisir(HEURES_DEBUT)
      const salle = choisir(sallesDisponibles)

      const candidat: CreneauEmploiDuTemps = {
        id: fabriquerId(),
        establishmentId: contexte.establishmentId,
        schoolYearId: contexte.schoolYearId,
        classId: affectation.classId,
        subjectId: affectation.subjectId,
        teacherId: affectation.teacherId,
        roomId: salle.id,
        dayOfWeek: jour,
        startTime: formaterHeure(debut),
        endTime: formaterHeure(debut + DUREE_HEURES),
      }

      if (detecterConflits(candidat, poses).length === 0) {
        poses.push(candidat)
        crees.push(candidat)
        place = true
        break
      }
    }

    if (!place) {
      echecs.push({
        affectation,
        raison: `Aucun créneau libre trouvé après ${TENTATIVES_MAX} tentatives.`,
      })
    }
  }

  return { crees, echecs }
}
