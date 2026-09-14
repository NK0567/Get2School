import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Etablissement, ParametresEtablissement } from '../../../socle/modeles/administration'
import {
  chargerEtablissement,
  enregistrerIdentite,
  enregistrerParametres,
  terminerConfiguration,
} from '../api'
import type { DemandeConfiguration, IdentiteEtablissement } from '../api'

const CLE = 'etablissement'

export function useEtablissement() {
  return useQuery({ queryKey: [CLE], queryFn: chargerEtablissement })
}

export function useEnregistrerIdentite() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ avant, modifs }: { avant: Etablissement; modifs: IdentiteEtablissement }) =>
      enregistrerIdentite(avant, modifs),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useEnregistrerParametres() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ avant, parametres }: { avant: Etablissement; parametres: ParametresEtablissement }) =>
      enregistrerParametres(avant, parametres),
    onSuccess: () => client.invalidateQueries({ queryKey: [CLE] }),
  })
}

export function useTerminerConfiguration() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (demande: DemandeConfiguration) => terminerConfiguration(demande),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [CLE] })
      client.invalidateQueries({ queryKey: ['annees-scolaires'] })
    },
  })
}
