import { useQuery } from '@tanstack/react-query'
import { listerPlanningClasse } from '../api'

export function usePlanningClasse(classId: string, periodId: string) {
  return useQuery({
    queryKey: ['planning', classId, periodId],
    queryFn: () => listerPlanningClasse(classId, periodId || undefined),
    enabled: Boolean(classId),
  })
}
