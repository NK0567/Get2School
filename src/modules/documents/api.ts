/**
 * Appels API du Centre documentaire · lot A (Boris)
 *
 * RG-17  Tout document généré porte une référence unique et un QR code qui
 *        mène à sa page publique de vérification.
 *
 * Un document généré est immuable. On ne le modifie pas, on ne le supprime
 * pas : on l'annule, ce qui le marque comme tel sur sa page de vérification.
 * Un certificat de scolarité déjà remis à une famille doit pouvoir être
 * invalidé sans disparaître des archives.
 */
import { api } from '../../socle/api/client'
import type { DocumentGenere } from '../../socle/modeles/administration'
import type { Page } from '../../socle/modeles/communs'
import { journaliser } from '../../socle/services/journalAudit'
import { libelleType } from './catalogue'

export interface FiltresDocuments {
  type?: string
  statut?: string
  du?: string
  au?: string
  page?: number
  taille?: number
}

export async function listerDocuments(filtres: FiltresDocuments) {
  const { data } = await api.get<Page<DocumentGenere>>('/documents', { params: filtres })
  return data
}

export interface DemandeGeneration {
  type: string
  /** Un identifiant par document à produire. */
  cibles: { id: string; libelle: string }[]
  schoolYearId: string
  periodId?: string
}

export interface ResultatGeneration {
  documents: DocumentGenere[]
  reussis: number
  echoues: number
}

export async function genererDocuments(demande: DemandeGeneration) {
  const { data } = await api.post<ResultatGeneration>('/documents/generate', demande)
  await journaliser({
    action: 'DOCUMENT_GENERATE',
    entityType: 'Document',
    entityId: data.documents[0]?.id ?? '—',
    entityLabel: `${libelleType(demande.type)} · ${demande.cibles.length} document(s)`,
    after: { type: demande.type, reussis: data.reussis, echoues: data.echoues },
  })
  return data
}

export async function annulerDocument(document: DocumentGenere, motif: string) {
  const { data } = await api.patch<DocumentGenere>(`/documents/${document.id}/cancel`, { motif })
  await journaliser({
    action: 'DOCUMENT_GENERATE',
    entityType: 'Document',
    entityId: document.id,
    entityLabel: `Annulation · ${document.reference}`,
    before: { status: document.status },
    after: { status: 'CANCELLED', motif },
  })
  return data
}

export async function chargerDocument(id: string) {
  const { data } = await api.get<DocumentGenere>(`/documents/${id}`)
  return data
}

/* ── Modèles documentaires ──────────────────────────────── */

export async function listerModeles() {
  const { data } = await api.get('/document-templates')
  return data
}

export async function activerModele(id: string, libelle: string) {
  const { data } = await api.patch(`/document-templates/${id}/activate`)
  await journaliser({
    action: 'PERMISSION_CHANGE',
    entityType: 'ModeleDocument',
    entityId: id,
    entityLabel: libelle,
    after: { isActive: true },
  })
  return data
}

/* ── Vérification publique ──────────────────────────────── */

export interface VerificationDocument {
  valide: boolean
  reference?: string
  type?: string
  etablissement?: string
  anneeScolaire?: string
  emisLe?: string
  statut?: 'GENERATED' | 'CANCELLED'
  titulaire?: string
}

/**
 * Route publique, sans authentification. Elle expose le minimum nécessaire
 * pour attester qu'un document est authentique : aucune note, aucun montant,
 * aucune donnée personnelle au-delà du nom du titulaire.
 */
export async function verifierDocument(reference: string) {
  const { data } = await api.get<VerificationDocument>(`/public/documents/${reference}`)
  return data
}
