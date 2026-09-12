import { useQuery } from '@tanstack/react-query'
import { api } from '../../socle/api/client'
import type { Enseignant } from '../../socle/modeles/scolarite'
import { formaterNomComplet } from '../formats'
import { Selecteur } from '../../ui'

interface Props {
  valeur: string
  onChange: (teacherId: string) => void
  libelle?: string
  placeholder?: string
  requis?: boolean
}

export function SelecteurEnseignant({
  valeur,
  onChange,
  libelle,
  placeholder = 'Tous les enseignants',
  requis,
}: Props) {
  const { data } = useQuery({
    queryKey: ['enseignants'],
    queryFn: async () => (await api.get<Enseignant[]>('/teachers')).data,
  })

  return (
    <Selecteur
      libelle={libelle}
      requis={requis}
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      options={(data ?? [])
        .filter((e) => e.isActive)
        .map((e) => ({ valeur: e.id, libelle: formaterNomComplet(e.firstName, e.lastName) }))}
    />
  )
}
