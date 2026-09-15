/**
 * Recherche globale · lot A (Boris)
 *
 * Deux règles de sécurité gouvernent ce module.
 *
 * 1. Le filtrage par rôle est appliqué PAR LE SERVEUR. Un enseignant qui
 *    cherche « Kamga » ne doit pas voir apparaître les paiements de l'élève,
 *    même sous forme de titre de résultat. Masquer ces résultats dans
 *    l'interface ne suffirait pas : la réponse elle-même ne doit pas les
 *    contenir.
 *
 * 2. Un résultat n'expose jamais de donnée sensible. On affiche un matricule
 *    et une classe, jamais une moyenne, un solde ni une adresse.
 */
import { api } from '../../socle/api/client'

export type TypeResultat = 'ELEVE' | 'ENSEIGNANT' | 'CLASSE' | 'UTILISATEUR' | 'DOCUMENT'

export interface ResultatRecherche {
  type: TypeResultat
  id: string
  titre: string
  /** Complément d'identification, sans donnée sensible. */
  precision?: string
  route: string
}

export interface ReponseRecherche {
  resultats: ResultatRecherche[]
  total: number
  /** Types que le rôle courant est autorisé à consulter. */
  typesAutorises: TypeResultat[]
}

export const LONGUEUR_MINIMALE = 2

export async function rechercher(terme: string, types?: TypeResultat[]) {
  const { data } = await api.get<ReponseRecherche>('/search', {
    params: { q: terme, types: types?.length ? types.join(',') : undefined },
  })
  return data
}

export const LIBELLE_TYPE: Record<TypeResultat, string> = {
  ELEVE: 'Élèves',
  ENSEIGNANT: 'Enseignants',
  CLASSE: 'Classes',
  UTILISATEUR: 'Comptes utilisateurs',
  DOCUMENT: 'Documents',
}
