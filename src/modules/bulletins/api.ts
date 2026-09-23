/**
 * Appels API du module Bulletins · lot C (Fabrice)
 *
 * Ce module CONSULTE le calcul, il ne produit pas de fichier. Le document
 * officiel, avec sa référence unique et son QR code (RG-17), est produit par
 * le Centre documentaire de Boris, qui lira ces mêmes données via le contrat
 * ReportCardData fixé dans socle/modeles/academique.ts (type DonneesBulletin).
 */
import { api } from '../../socle/api/client'
import type { DonneesBulletin } from '../../socle/modeles/academique'

export interface LigneClassement {
  enrollmentId: string
  matricule: string
  fullName: string
  average: number | null
  rank: number | null
}

export async function chargerBulletin(enrollmentId: string, periodId: string) {
  const { data } = await api.get<DonneesBulletin>(`/report-cards/${enrollmentId}/${periodId}`)
  return data
}

export async function chargerClassement(classId: string, periodId: string) {
  const { data } = await api.get<LigneClassement[]>('/report-cards', {
    params: { classId, periodId },
  })
  return data
}
