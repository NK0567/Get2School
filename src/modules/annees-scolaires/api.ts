/**
 * Appels API du module Années scolaires · lot A (Boris)
 *
 * Règles portees par ce module :
 *   RG-08  une période verrouillée interdit toute modification de note ;
 *          seul le SCHOOL_ADMIN deverrouille, avec motif et trace.
 *   Une seule année peut être ouverte à la fois.
 *   Le nombre de périodes est figé à l'ouverture de l'année.
 *   Aucune donnée historique n'est supprimée : la clôture archive.
 */
import { api } from '../../socle/api/client'
import type { AnneeScolaire, Periode } from '../../socle/modeles/administration'
import { journaliser } from '../../socle/services/journalAudit'

export async function listerAnnees() {
  const { data } = await api.get<AnneeScolaire[]>('/school-years')
  return data
}

export async function chargerAnnee(id: string) {
  const { data } = await api.get<AnneeScolaire>(`/school-years/${id}`)
  return data
}

export interface CreationAnnee {
  label: string
  startDate: string
  endDate: string
  periodType: 'TRIMESTER' | 'SEMESTER'
}

export async function creerAnnee(corps: CreationAnnee) {
  const { data } = await api.post<AnneeScolaire>('/school-years', corps)
  return data
}

export async function ouvrirAnnee(annee: AnneeScolaire) {
  const { data } = await api.patch<AnneeScolaire>(`/school-years/${annee.id}/open`)
  await journaliser({
    action: 'YEAR_OPEN',
    entityType: 'AnneeScolaire',
    entityId: annee.id,
    entityLabel: annee.label,
    before: { status: annee.status },
    after: { status: data.status },
  })
  return data
}

export async function cloturerAnnee(annee: AnneeScolaire) {
  const { data } = await api.patch<AnneeScolaire>(`/school-years/${annee.id}/close`)
  await journaliser({
    action: 'YEAR_CLOSE',
    entityType: 'AnneeScolaire',
    entityId: annee.id,
    entityLabel: annee.label,
    before: { status: annee.status },
    after: { status: data.status },
  })
  return data
}

export async function verrouillerPeriode(periode: Periode, anneeLabel: string) {
  const { data } = await api.patch<Periode>(`/periods/${periode.id}/lock`)
  await journaliser({
    action: 'PERIOD_LOCK',
    entityType: 'Periode',
    entityId: periode.id,
    entityLabel: `${periode.label} · ${anneeLabel}`,
    before: { isLocked: false },
    after: { isLocked: true },
  })
  return data
}

/** Le motif est obligatoire : c'est la contrepartie d'une opération sensible. */
export async function deverrouillerPeriode(periode: Periode, anneeLabel: string, motif: string) {
  const { data } = await api.patch<Periode>(`/periods/${periode.id}/unlock`, { motif })
  await journaliser({
    action: 'PERIOD_UNLOCK',
    entityType: 'Periode',
    entityId: periode.id,
    entityLabel: `${periode.label} · ${anneeLabel}`,
    before: { isLocked: true },
    after: { isLocked: false, motif },
  })
  return data
}
