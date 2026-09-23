/**
 * Appels API du module Classes · lot B (Alida)
 *
 * RG-05 : une classe appartient à une année scolaire. On ne réutilise pas la
 * classe d'une année sur l'autre, on la recrée — d'où la duplication à
 * l'ouverture d'une nouvelle année plutôt qu'un renommage.
 *
 * Une classe ne se supprime pas si des élèves y sont inscrits : c'est le
 * seul verrou de ce module, tout le reste (matières, enseignant principal,
 * salle) reste modifiable librement tant que l'année n'est pas clôturée.
 */
import { api } from '../../socle/api/client'
import type { Classe } from '../../socle/modeles/scolarite'

export interface FiltresClasses {
  level?: string
  schoolYearId?: string
}

export async function listerClasses(filtres: FiltresClasses) {
  const { data } = await api.get<Classe[]>('/classes', { params: filtres })
  return data
}

export async function chargerClasse(id: string) {
  const { data } = await api.get<Classe>(`/classes/${id}`)
  return data
}

export interface CreationClasse {
  name: string
  level: string
  series?: string
  capacity: number
  roomId?: string
}

export async function creerClasse(corps: CreationClasse) {
  const { data } = await api.post<Classe>('/classes', corps)
  return data
}

export interface ModificationClasse {
  capacity: number
  roomId?: string
  headTeacherId?: string
}

export async function modifierClasse(classe: Classe, modifs: ModificationClasse) {
  const { data } = await api.put<Classe>(`/classes/${classe.id}`, modifs)
  return data
}

/**
 * Reprend la structure des classes d'une année pour en créer les
 * équivalents sur la nouvelle année, sans copier les élèves : chaque classe
 * démarre à zéro inscrit, prête à recevoir les réinscriptions.
 */
export async function dupliquerClassesVersAnnee(schoolYearSourceId: string, schoolYearCibleId: string) {
  const { data } = await api.post<Classe[]>('/classes/duplicate', {
    schoolYearSourceId,
    schoolYearCibleId,
  })
  return data
}

export const NIVEAUX_CONNUS = ['6e', '5e', '4e', '3e', 'Seconde', 'Premiere', 'Terminale']
