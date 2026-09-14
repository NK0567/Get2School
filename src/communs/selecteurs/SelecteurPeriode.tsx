import { useQuery } from '@tanstack/react-query'
import { api } from '../../socle/api/client'
import { useContexteScolaire } from '../../socle/etat/useContexteScolaire'
import type { AnneeScolaire } from '../../socle/modeles/administration'
import { Selecteur } from '../../ui'

interface Props {
  valeur: string
  onChange: (periodId: string) => void
  libelle?: string
  placeholder?: string
  requis?: boolean
}

/** Périodes de l'année scolaire sélectionnée, avec mention du verrouillage. */
export function SelecteurPeriode({
  valeur,
  onChange,
  libelle,
  placeholder = 'Toutes les périodes',
  requis,
}: Props) {
  const anneeId = useContexteScolaire((e) => e.anneeId)

  const { data } = useQuery({
    queryKey: ['annees-scolaires'],
    queryFn: async () => (await api.get<AnneeScolaire[]>('/school-years')).data,
  })

  const periodes = data?.find((a) => a.id === anneeId)?.periods ?? []

  return (
    <Selecteur
      libelle={libelle}
      requis={requis}
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      options={periodes.map((p) => ({
        valeur: p.id,
        libelle: p.isLocked ? `${p.label} (verrouillee)` : p.label,
      }))}
    />
  )
}
