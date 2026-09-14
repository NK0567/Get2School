import { useQuery } from '@tanstack/react-query'
import { api } from '../../socle/api/client'
import { useContexteScolaire } from '../../socle/etat/useContexteScolaire'
import type { Classe } from '../../socle/modeles/scolarite'
import { Selecteur } from '../../ui'

interface Props {
  valeur: string
  onChange: (classId: string) => void
  libelle?: string
  placeholder?: string
  requis?: boolean
}

/**
 * Selecteur de classe partage par les trois lots.
 * Filtre automatiquement sur l'année scolaire sélectionnée dans la barre haute.
 */
export function SelecteurClasse({
  valeur,
  onChange,
  libelle,
  placeholder = 'Toutes les classes',
  requis,
}: Props) {
  const anneeId = useContexteScolaire((e) => e.anneeId)

  const { data } = useQuery({
    queryKey: ['classes', anneeId],
    queryFn: async () => (await api.get<Classe[]>('/classes')).data,
  })

  const classes = (data ?? []).filter((c) => !anneeId || c.schoolYearId === anneeId)

  return (
    <Selecteur
      libelle={libelle}
      requis={requis}
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      options={classes.map((c) => ({ valeur: c.id, libelle: c.name }))}
    />
  )
}
