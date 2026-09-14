import { useQuery } from '@tanstack/react-query'
import { listerEntrees } from '../api'
import type { FiltresAudit } from '../api'

export function useJournalAudit(filtres: FiltresAudit) {
  return useQuery({
    queryKey: ['journal-audit', filtres],
    queryFn: () => listerEntrees(filtres),
  })
}
