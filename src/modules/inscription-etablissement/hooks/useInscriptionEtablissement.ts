import { useMutation, useQuery } from '@tanstack/react-query'
import { codeDisponible, inscrireEtablissement } from '../api'
import type { InscriptionEtablissement } from '../api'

export function useInscrireEtablissement() {
  return useMutation({
    mutationFn: (corps: InscriptionEtablissement) => inscrireEtablissement(corps),
  })
}

export function useCodeDisponible(nom: string) {
  return useQuery({
    queryKey: ['code-disponible', nom],
    queryFn: () => codeDisponible(nom),
    enabled: nom.trim().length >= 3,
  })
}
