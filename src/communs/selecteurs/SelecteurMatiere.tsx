import { useQuery } from '@tanstack/react-query'
import { api } from '../../socle/api/client'
import type { Matiere } from '../../socle/modeles/scolarite'
import { Selecteur } from '../../ui'

interface Props {
  valeur: string
  onChange: (subjectId: string) => void
  libelle?: string
  placeholder?: string
  requis?: boolean
}

export function SelecteurMatiere({
  valeur,
  onChange,
  libelle,
  placeholder = 'Toutes les matieres',
  requis,
}: Props) {
  const { data } = useQuery({
    queryKey: ['matieres'],
    queryFn: async () => (await api.get<Matiere[]>('/subjects')).data,
  })

  return (
    <Selecteur
      libelle={libelle}
      requis={requis}
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      options={(data ?? []).filter((m) => m.isActive).map((m) => ({ valeur: m.id, libelle: m.name }))}
    />
  )
}
