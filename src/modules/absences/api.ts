/**
 * Appels API du module Absences · lot C (Fabrice)
 *
 * Seules les exceptions sont enregistrées : une absence ou un retard. La
 * présence d'un élève ne produit aucune ligne, ce que reflète le modèle
 * Presence (type: 'ABSENCE' | 'LATE' uniquement). Stocker une ligne « présent »
 * par élève et par jour n'apporterait rien et alourdirait la base pour rien.
 *
 * La justification est un geste en deux temps, distinct de la déclaration :
 * l'absence est d'abord enregistrée non justifiée, un justificatif est
 * déposé ensuite. Ce ne sont jamais le même écran ni le même appel.
 */
import { api } from '../../socle/api/client'
import type { Presence } from '../../socle/modeles/academique'
import type { Page } from '../../socle/modeles/communs'

export interface FiltresAbsences {
  classId?: string
  studentId?: string
  type?: Presence['type'] | ''
  justifie?: string
  du?: string
  au?: string
  page?: number
  taille?: number
}

export async function listerAbsences(filtres: FiltresAbsences) {
  const { data } = await api.get<Page<Presence>>('/attendance', { params: filtres })
  return data
}

export interface SaisieAppel {
  studentId: string
  enrollmentId: string
  type: Presence['type']
  durationMinutes?: number
}

/**
 * Enregistre l'appel d'une classe à une date donnée. Seuls les élèves
 * marqués absents ou en retard sont envoyés : les autres sont présents par
 * défaut, sans qu'aucune ligne ne soit créée pour eux.
 *
 * CONTRAT IMPORTANT : `saisies` doit toujours représenter l'état COMPLET des
 * exceptions de la classe pour cette date, pas une correction partielle. Le
 * serveur remplace toutes les exceptions existantes de la classe à cette
 * date par celles envoyées. FeuilleAppel.tsx respecte ce contrat : il
 * recalcule `exceptions` à partir de l'état de toute la grille à chaque
 * enregistrement, jamais d'un sous-ensemble. Un appel qui n'enverrait que
 * les lignes modifiées effacerait par erreur les exceptions déjà saisies
 * pour les élèves absents de cet envoi partiel.
 */
export async function faireAppel(classId: string, date: string, saisies: SaisieAppel[]) {
  const { data } = await api.post<Presence[]>('/attendance/roll-call', { classId, date, saisies })
  return data
}

export async function justifierAbsence(presence: Presence, motif: string) {
  const { data } = await api.patch<Presence>(`/attendance/${presence.id}/justify`, { motif })
  return data
}

export const LIBELLE_TYPE_ABSENCE: Record<Presence['type'], string> = {
  ABSENCE: 'Absence',
  LATE: 'Retard',
}
