import { cn } from '../../../ui'

interface Props {
  avant: unknown
  apres: unknown
}

type Ligne = { cle: string; avant: string; apres: string; modifie: boolean }

function aplatir(valeur: unknown): Record<string, string> {
  if (valeur === null || valeur === undefined) return {}
  if (typeof valeur !== 'object') return { valeur: String(valeur) }

  const plat: Record<string, string> = {}
  const parcourir = (objet: Record<string, unknown>, prefixe = '') => {
    for (const [cle, val] of Object.entries(objet)) {
      const chemin = prefixe ? `${prefixe}.${cle}` : cle
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        parcourir(val as Record<string, unknown>, chemin)
      } else {
        plat[chemin] = Array.isArray(val) ? val.join(', ') : String(val ?? '—')
      }
    }
  }
  parcourir(valeur as Record<string, unknown>)
  return plat
}

/**
 * Affiche l'état avant et après d'une opération, champ par champ.
 * Les champs modifiés sont mis en évidence : c'est ce qui rend le journal
 * exploitable lors d'un contrôle, plutôt qu'un simple dépôt de données brutes.
 */
export function ComparaisonValeurs({ avant, apres }: Props) {
  const a = aplatir(avant)
  const b = aplatir(apres)
  const cles = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()

  if (cles.length === 0) {
    return (
      <p className="text-muted text-[13px]">
        Cette opération ne modifie aucune valeur : seule sa survenue est enregistrée.
      </p>
    )
  }

  const lignes: Ligne[] = cles.map((cle) => ({
    cle,
    avant: a[cle] ?? '—',
    apres: b[cle] ?? '—',
    modifie: a[cle] !== b[cle],
  }))

  return (
    <div className="border-line overflow-hidden rounded-lg border">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-line bg-canvas text-muted border-b text-[11px] font-semibold">
            <th className="px-3 py-2 text-left">Champ</th>
            <th className="px-3 py-2 text-left">Avant</th>
            <th className="px-3 py-2 text-left">Après</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => (
            <tr
              key={ligne.cle}
              className={cn('border-line border-b last:border-0', ligne.modifie && 'bg-warning/5')}
            >
              <td className="text-ink px-3 py-2 font-medium">{ligne.cle}</td>
              <td className={cn('px-3 py-2', ligne.modifie ? 'text-danger line-through' : 'text-muted')}>
                {ligne.avant}
              </td>
              <td className={cn('px-3 py-2', ligne.modifie ? 'text-success font-medium' : 'text-muted')}>
                {ligne.apres}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
