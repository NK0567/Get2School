/**
 * Appels API du module Salles · lot B (Alida)
 *
 * `isAvailable` est un état déclaré (hors service, en travaux), pas un
 * calcul d'occupation en temps réel : celui-ci dépendrait de l'emploi du
 * temps, qui n'existe pas encore. Rendre une salle indisponible n'empêche
 * pas techniquement une classe de continuer à la référencer : ce module ne
 * fait qu'avertir, il ne verrouille rien qui dépendrait d'un module absent.
 */
import { api } from '../../socle/api/client'
import type { Salle } from '../../socle/modeles/scolarite'

export async function listerSalles() {
  const { data } = await api.get<Salle[]>('/rooms')
  return data
}

export interface CreationSalle {
  name: string
  capacity: number
  type: Salle['type']
}

export async function creerSalle(corps: CreationSalle) {
  const { data } = await api.post<Salle>('/rooms', corps)
  return data
}

export interface ModificationSalle {
  capacity: number
  type: Salle['type']
}

export async function modifierSalle(salle: Salle, modifs: ModificationSalle) {
  const { data } = await api.put<Salle>(`/rooms/${salle.id}`, modifs)
  return data
}

export interface ResultatDisponibilite {
  salle: Salle
  /** Classes qui référencent actuellement cette salle, pour avertir avant de la rendre indisponible. */
  classesConcernees: string[]
}

export async function changerDisponibiliteSalle(salle: Salle, disponible: boolean) {
  const { data } = await api.patch<ResultatDisponibilite>(`/rooms/${salle.id}/availability`, {
    isAvailable: disponible,
  })
  return data
}

export const LIBELLE_TYPE_SALLE: Record<Salle['type'], string> = {
  CLASSROOM: 'Salle de classe',
  LAB: 'Laboratoire',
  AMPHI: 'Amphithéâtre',
  WORKSHOP: 'Atelier',
}
