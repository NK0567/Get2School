import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DocumentGenere } from '../../../socle/modeles/administration'
import {
  activerModele,
  annulerDocument,
  chargerDocument,
  genererDocuments,
  listerDocuments,
  listerModeles,
} from '../api'
import type { DemandeGeneration, FiltresDocuments } from '../api'

const CLE = 'documents'

export function useDocuments(filtres: FiltresDocuments) {
  return useQuery({ queryKey: [CLE, filtres], queryFn: () => listerDocuments(filtres) })
}

export function useDocument(id?: string) {
  return useQuery({
    queryKey: [CLE, 'unite', id],
    queryFn: () => chargerDocument(id as string),
    enabled: Boolean(id),
  })
}

export function useGenerer() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (demande: DemandeGeneration) => genererDocuments(demande),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useAnnulerDocument() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ document, motif }: { document: DocumentGenere; motif: string }) =>
      annulerDocument(document, motif),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useModeles() {
  return useQuery({ queryKey: ['modeles-documents'], queryFn: listerModeles })
}

export function useActiverModele() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, libelle }: { id: string; libelle: string }) => activerModele(id, libelle),
    onSuccess: () => client.invalidateQueries({ queryKey: ['modeles-documents'] }),
  })
}
