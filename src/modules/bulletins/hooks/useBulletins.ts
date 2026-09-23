import { useQuery } from '@tanstack/react-query'
import { chargerBulletin, chargerClassement } from '../api'

export function useClassement(classId: string, periodId: string) {
  return useQuery({
    queryKey: ['classement', classId, periodId],
    queryFn: () => chargerClassement(classId, periodId),
    enabled: Boolean(classId && periodId),
  })
}

export function useBulletin(enrollmentId?: string, periodId?: string) {
  return useQuery({
    queryKey: ['bulletin', enrollmentId, periodId],
    queryFn: () => chargerBulletin(enrollmentId as string, periodId as string),
    enabled: Boolean(enrollmentId && periodId),
  })
}
