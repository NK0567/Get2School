/**
 * Appels API du module Établissement · lot A (Boris)
 */
import { api } from '../../socle/api/client'
import type { Etablissement, ParametresEtablissement } from '../../socle/modeles/administration'
import { journaliser } from '../../socle/services/journalAudit'

export async function chargerEtablissement() {
  const { data } = await api.get<Etablissement>('/establishments/current')
  return data
}

export type IdentiteEtablissement = Pick<
  Etablissement,
  'name' | 'acronym' | 'slogan' | 'address' | 'phone' | 'email' | 'website'
>

export async function enregistrerIdentite(avant: Etablissement, modifs: IdentiteEtablissement) {
  const { data } = await api.put<Etablissement>('/establishments/current', modifs)
  await journaliser({
    action: 'USER_UPDATE',
    entityType: 'Établissement',
    entityId: avant.id,
    entityLabel: avant.name,
    before: { name: avant.name, phone: avant.phone, email: avant.email },
    after: { name: modifs.name, phone: modifs.phone, email: modifs.email },
  })
  return data
}

export async function enregistrerParametres(avant: Etablissement, parametres: ParametresEtablissement) {
  const { data } = await api.put<Etablissement>('/establishments/current/settings', parametres)
  await journaliser({
    action: 'PERMISSION_CHANGE',
    entityType: 'ParametresEtablissement',
    entityId: avant.id,
    entityLabel: `Parametres de ${avant.name}`,
    before: avant.settings,
    after: parametres,
  })
  return data
}

export interface DemandeConfiguration {
  identite: IdentiteEtablissement
  academique: { anneeLabel: string; startDate: string; endDate: string; periodType: 'TRIMESTER' | 'SEMESTER' }
  regles: ParametresEtablissement
}

export async function terminerConfiguration(demande: DemandeConfiguration) {
  const { data } = await api.post<Etablissement>('/establishments/current/setup', demande)
  await journaliser({
    action: 'YEAR_OPEN',
    entityType: 'Établissement',
    entityId: data.id,
    entityLabel: data.name,
    after: { status: data.status, annee: demande.academique.anneeLabel },
  })
  return data
}
