/**
 * Détection de conflits d'emploi du temps · lot B (Alida)
 *
 * Fonction pure, même principe que les autres moteurs de calcul du projet :
 * testée seule, réutilisée telle quelle côté simulation.
 *
 * Contrairement au Planning des évaluations (avertissement non bloquant), un
 * conflit d'emploi du temps est un impossible physique : un enseignant ou
 * une salle ne peuvent pas être à deux endroits à la fois. C'est donc un
 * blocage, pas un simple repère.
 */
import type { CreneauEmploiDuTemps } from '../../socle/modeles/scolarite'

type Creneau = Pick<
  CreneauEmploiDuTemps,
  'dayOfWeek' | 'startTime' | 'endTime' | 'teacherId' | 'roomId' | 'classId'
>

function heuresEnChevauchement(a: Creneau, b: Creneau): boolean {
  if (a.dayOfWeek !== b.dayOfWeek) return false
  return a.startTime < b.endTime && b.startTime < a.endTime
}

export type RaisonConflit = 'ENSEIGNANT' | 'SALLE' | 'CLASSE'

export interface ConflitDetecte {
  creneau: CreneauEmploiDuTemps
  raisons: RaisonConflit[]
}

/**
 * Renvoie les créneaux existants qui entrent en conflit avec le nouveau,
 * avec la ou les raisons (un enseignant et une salle peuvent être en
 * conflit sur le même créneau existant en même temps).
 */
export function detecterConflits(nouveau: Creneau, existants: CreneauEmploiDuTemps[]): ConflitDetecte[] {
  const conflits: ConflitDetecte[] = []

  for (const creneau of existants) {
    if (!heuresEnChevauchement(nouveau, creneau)) continue

    const raisons: RaisonConflit[] = []
    if (creneau.teacherId === nouveau.teacherId) raisons.push('ENSEIGNANT')
    if (creneau.roomId === nouveau.roomId) raisons.push('SALLE')
    if (creneau.classId === nouveau.classId) raisons.push('CLASSE')

    if (raisons.length > 0) conflits.push({ creneau, raisons })
  }

  return conflits
}

export const LIBELLE_JOUR: Record<number, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
}

export const LIBELLE_RAISON_CONFLIT: Record<RaisonConflit, string> = {
  ENSEIGNANT: "L'enseignant est déjà sur un autre créneau",
  SALLE: 'La salle est déjà occupée',
  CLASSE: 'La classe a déjà cours sur ce créneau',
}
