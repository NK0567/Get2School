/**
 * Appels API du module Planning des évaluations · lot C (Fabrice)
 *
 * Vue transversale, volontairement PAS restreinte à ses propres matières
 * comme le sont les écrans de notes : le but explicite de cet écran est de
 * voir les évaluations déjà programmées par les autres enseignants sur une
 * même classe, pour éviter d'en ajouter une quatrième la même semaine. Une
 * restriction par matière ici irait contre l'objet même du module.
 *
 * Ce module ne crée aucune évaluation : la création reste dans le module
 * Évaluations. Dupliquer un second formulaire ici aurait fait dériver deux
 * sources de vérité sur le même objet.
 */
import { api } from '../../socle/api/client'
import type { Evaluation } from '../../socle/modeles/academique'

export async function listerPlanningClasse(classId: string, periodId?: string) {
  const { data } = await api.get<Evaluation[]>('/planning', { params: { classId, periodId } })
  return data
}

/** Nombre d'évaluations au-delà duquel une semaine est signalée en surcharge. */
export const SEUIL_SURCHARGE_HEBDOMADAIRE = 3

/** Clé de semaine ISO (année-numéro de semaine), pour grouper sans dépendance externe. */
export function cleSemaine(dateIso: string): string {
  const date = new Date(dateIso)
  const jour = (date.getDay() + 6) % 7 // lundi = 0
  date.setDate(date.getDate() - jour + 3) // jeudi de la même semaine
  const premierJanvier = new Date(date.getFullYear(), 0, 1)
  const numero = Math.ceil(((date.getTime() - premierJanvier.getTime()) / 86400000 + 1) / 7)
  return `${date.getFullYear()}-S${String(numero).padStart(2, '0')}`
}
