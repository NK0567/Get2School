/**
 * Appels API du module Emploi du temps · lot B (Alida)
 *
 * Un conflit d'emploi du temps (enseignant, salle ou classe déjà occupés sur
 * le créneau) est un blocage réel, pas un avertissement comme dans le
 * Planning des évaluations : un enseignant ou une salle ne peuvent
 * physiquement pas être à deux endroits à la fois. La création est refusée
 * côté serveur, avec le détail du ou des conflits.
 */
import { api } from '../../socle/api/client'
import type { CreneauEmploiDuTemps } from '../../socle/modeles/scolarite'

export interface FiltresCreneaux {
  classId?: string
  teacherId?: string
  roomId?: string
}

export async function listerCreneaux(filtres: FiltresCreneaux) {
  const { data } = await api.get<CreneauEmploiDuTemps[]>('/timetable', { params: filtres })
  return data
}

export interface CreationCreneau {
  classId: string
  subjectId: string
  teacherId: string
  roomId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

/**
 * En cas de conflit, le serveur répond 409 avec un message qui énumère
 * chaque raison en clair (enseignant, salle ou classe déjà occupés, et avec
 * quel autre cours). L'intercepteur global (socle/api/client.ts) ne conserve
 * que ce message texte sur une erreur, jamais de donnée structurée : c'est
 * pourquoi le détail est rédigé entièrement côté serveur plutôt que renvoyé
 * comme une liste à mettre en forme côté client.
 */
export async function creerCreneau(corps: CreationCreneau) {
  const { data } = await api.post<CreneauEmploiDuTemps>('/timetable', corps)
  return data
}

export async function supprimerCreneau(id: string) {
  await api.delete(`/timetable/${id}`)
}

export interface EchecGeneration {
  classe: string
  matiere: string
  enseignant: string
  raison: string
}

export interface ResultatGenerationAutomatique {
  crees: number
  total: number
  echecs: EchecGeneration[]
}

/**
 * Génère un créneau par couple (classe, matière, enseignant) des
 * affectations de l'année ouverte, sans toucher aux créneaux déjà posés.
 * Peut échouer partiellement — voir le rapport `echecs`, jamais masqué.
 */
export async function genererAutomatiquement() {
  const { data } = await api.post<ResultatGenerationAutomatique>('/timetable/generate')
  return data
}
