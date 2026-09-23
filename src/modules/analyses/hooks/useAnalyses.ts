import { useQuery } from '@tanstack/react-query'
import { chargerElevesARisque, chargerEvolutionClasse } from '../api'

export function useElevesARisque(classId: string, periodId: string) {
  return useQuery({
    queryKey: ['eleves-a-risque', classId, periodId],
    queryFn: () => chargerElevesARisque(classId, periodId),
    enabled: Boolean(classId && periodId),
  })
}

export function useEvolutionClasse(classId: string, enrollmentId: string) {
  return useQuery({
    queryKey: ['evolution-classe', classId, enrollmentId],
    queryFn: () => chargerEvolutionClasse(classId, enrollmentId || undefined),
    enabled: Boolean(classId),
  })
}
