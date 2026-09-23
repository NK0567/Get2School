/**
 * Appels API du module Élèves · lot B (Alida)
 *
 * RG-03 : le matricule est unique dans l'établissement et immuable une fois
 * créé. Il est généré par le serveur à la création, jamais saisi à la main.
 * Le compteur repart à 0001 à chaque nouvelle année scolaire.
 *
 * Un élève ne se supprime jamais : il s'archive (RG conservation des
 * données historiques). L'archivage est une opération sensible, journalisée.
 */
import { api } from '../../socle/api/client'
import type { Eleve } from '../../socle/modeles/scolarite'
import type { Page } from '../../socle/modeles/communs'
import { journaliser } from '../../socle/services/journalAudit'

export interface FiltresEleves {
  recherche?: string
  classId?: string
  status?: Eleve['status'] | ''
  page?: number
  taille?: number
}

export async function listerEleves(filtres: FiltresEleves) {
  const { data } = await api.get<Page<Eleve>>('/students', { params: filtres })
  return data
}

export async function chargerEleve(id: string) {
  const { data } = await api.get<Eleve>(`/students/${id}`)
  return data
}

export interface CreationEleve {
  firstName: string
  lastName: string
  birthDate: string
  birthPlace: string
  gender: Eleve['gender']
  phone?: string
  address?: string
  guardianName: string
  guardianPhone: string
  guardianRelationship: Eleve['guardianRelationship']
  /** Classe d'inscription immédiate. La création d'un élève crée toujours
   * une inscription active dans le même geste : un élève sans inscription
   * n'a pas de sens dans l'application. */
  classId: string
}

export async function creerEleve(corps: CreationEleve) {
  const { data } = await api.post<Eleve>('/students', corps)
  return data
}

export interface ModificationEleve {
  phone?: string
  address?: string
  guardianName: string
  guardianPhone: string
  guardianRelationship: Eleve['guardianRelationship']
}

export async function modifierEleve(eleve: Eleve, modifs: ModificationEleve) {
  const { data } = await api.put<Eleve>(`/students/${eleve.id}`, modifs)
  return data
}

export async function archiverEleve(eleve: Eleve, motif: string) {
  const { data } = await api.patch<Eleve>(`/students/${eleve.id}/archive`, { motif })
  await journaliser({
    action: 'STUDENT_ARCHIVE',
    entityType: 'Eleve',
    entityId: eleve.id,
    entityLabel: `${eleve.lastName.toUpperCase()} ${eleve.firstName} · ${eleve.matricule}`,
    before: { status: eleve.status },
    after: { status: 'ARCHIVED', motif },
  })
  return data
}

export const LIBELLE_STATUT: Record<Eleve['status'], string> = {
  ACTIVE: 'Actif',
  TRANSFERRED: 'Transféré',
  DROPPED: 'Abandon',
  GRADUATED: 'Diplômé',
  ARCHIVED: 'Archivé',
}

export const LIBELLE_RELATION: Record<Eleve['guardianRelationship'], string> = {
  FATHER: 'Père',
  MOTHER: 'Mère',
  TUTOR: 'Tuteur',
  OTHER: 'Autre',
}
