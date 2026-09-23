import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chargerStatutEssai, sabonner } from '../api'

export function useStatutEssai() {
  return useQuery({
    queryKey: ['abonnement', 'statut'],
    queryFn: chargerStatutEssai,
    // Le déclencheur "4 mois écoulés" est un calcul basé sur l'heure : le
    // revérifier de temps en temps, pas seulement au chargement de la page,
    // sinon un essai qui expire pendant une session ouverte ne se
    // remarquerait qu'au prochain rechargement.
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useSabonner() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (planId: 'PRIMARY' | 'SECONDARY') => sabonner(planId),
    onSuccess: () => client.invalidateQueries({ queryKey: ['abonnement'] }),
  })
}
