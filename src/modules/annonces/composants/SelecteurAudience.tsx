import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { Selecteur } from '../../../ui'
import { SelecteurClasse } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Annonce } from '../../../socle/modeles/administration'
import type { Classe } from '../../../socle/modeles/scolarite'
import { LIBELLE_AUDIENCE, compterDestinataires } from '../api'

interface Props {
  type: Annonce['audienceType']
  refs: string[]
  onChange: (type: Annonce['audienceType'], refs: string[]) => void
}

/**
 * Le nombre de destinataires est calculé par le serveur et affiché avant
 * publication. Diffuser un message sans savoir combien de personnes le
 * recevront est le moyen le plus sûr d'envoyer une convocation à tout
 * l'établissement au lieu d'une seule classe.
 */
export function SelecteurAudience({ type, refs, onChange }: Props) {
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<Classe[]>('/classes')).data,
    enabled: type === 'CLASS' || type === 'LEVEL',
  })

  const { data: audience, isLoading } = useQuery({
    queryKey: ['audience', type, refs],
    queryFn: () => compterDestinataires(type, refs),
    enabled: type !== 'CLASS' || refs.length > 0,
  })

  const niveaux = [...new Set((classes ?? []).map((c) => c.level))]

  return (
    <div className="flex flex-col gap-4">
      <Selecteur
        libelle="Destinataires"
        requis
        value={type}
        onChange={(e) => onChange(e.target.value as Annonce['audienceType'], [])}
        options={(Object.keys(LIBELLE_AUDIENCE) as Annonce['audienceType'][])
          .filter((t) => t !== 'CUSTOM_GROUP')
          .map((t) => ({ valeur: t, libelle: LIBELLE_AUDIENCE[t] }))}
      />

      {type === 'CLASS' && (
        <SelecteurClasse
          libelle="Classe concernée"
          requis
          valeur={refs[0] ?? ''}
          onChange={(v) => onChange('CLASS', v ? [v] : [])}
          placeholder="Choisissez une classe"
        />
      )}

      {type === 'LEVEL' && (
        <Selecteur
          libelle="Niveau concerné"
          requis
          value={refs[0] ?? ''}
          onChange={(e) => onChange('LEVEL', e.target.value ? [e.target.value] : [])}
          placeholder="Choisissez un niveau"
          options={niveaux.map((n) => ({ valeur: n, libelle: n }))}
        />
      )}

      <div className="border-line bg-canvas flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5">
        <Users className="text-muted mt-0.5 h-4 w-4 shrink-0" />
        <div className="text-[12px]">
          {isLoading ? (
            <span className="text-muted">Calcul des destinataires…</span>
          ) : audience && audience.nombre > 0 ? (
            <>
              <span className="text-ink font-semibold tabular-nums">{audience.nombre}</span>{' '}
              <span className="text-muted">
                destinataire(s) : {audience.apercu.join(', ')}
                {audience.nombre > audience.apercu.length && ", et d'autres"}
              </span>
            </>
          ) : (
            <span className="text-warning">
              Aucun destinataire pour cette sélection. L'annonce ne serait lue par personne.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
