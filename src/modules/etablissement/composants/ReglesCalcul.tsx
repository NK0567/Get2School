import { Alerte, Champ } from '../../../ui'
import type { ParametresEtablissement } from '../../../socle/modeles/administration'

interface Props {
  valeurs: ParametresEtablissement
  onChange: (valeurs: ParametresEtablissement) => void
}

/**
 * Règles de calcul partagées avec le lot C.
 *
 * L'effet d'une sanction sur la moyenne n'est pas un réglage : une note
 * sanctionnée vaut toujours 0, coefficient compris. Une absence avec motif
 * valable est un cas distinct (statut « Absent »), qui sort la note du
 * calcul entièrement — elle se déclare séparément dans la grille de saisie,
 * pas ici.
 */
export function ReglesCalcul({ valeurs, onChange }: Props) {
  const maj = (modifs: Partial<ParametresEtablissement>) => onChange({ ...valeurs, ...modifs })

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <Champ
          libelle="Barème par défaut"
          requis
          type="number"
          min={1}
          value={valeurs.maxGrade}
          onChange={(e) => maj({ maxGrade: Number(e.target.value) })}
          aide="Note maximale d'une évaluation"
        />
        <Champ
          libelle="Moyenne de passage"
          requis
          type="number"
          min={0}
          max={valeurs.maxGrade}
          value={valeurs.passingGrade}
          onChange={(e) => maj({ passingGrade: Number(e.target.value) })}
          aide="Seuil du taux de réussite"
        />
        <Champ
          libelle="Devise"
          requis
          value={valeurs.currency}
          onChange={(e) => maj({ currency: e.target.value })}
        />
      </div>

      <Alerte ton="info">
        Une note sanctionnée vaut toujours 0, coefficient compris dans la moyenne. Une absence justifiée par
        un motif valable (maladie, etc.) se déclare séparément dans la grille de saisie des notes : elle sort
        entièrement du calcul, coefficient exclu.
      </Alerte>
    </div>
  )
}
