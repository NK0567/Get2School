import { Alerte, Champ, Selecteur } from '../../../ui'
import type { ParametresEtablissement } from '../../../socle/modeles/administration'

interface Props {
  valeurs: ParametresEtablissement
  onChange: (valeurs: ParametresEtablissement) => void
}

/**
 * Regles de calcul partagees avec le lot C.
 *
 * penaltyPolicy est le reglage le plus important du produit : il decide si le
 * coefficient d'une evaluation sanctionnee reste compte au denominateur de la
 * moyenne, ou s'il en sort. Le moteur de calcul de Fabrice lit ce parametre.
 */
export function ReglesCalcul({ valeurs, onChange }: Props) {
  const maj = (modifs: Partial<ParametresEtablissement>) => onChange({ ...valeurs, ...modifs })

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <Champ
          libelle="Bareme par defaut"
          requis
          type="number"
          min={1}
          value={valeurs.maxGrade}
          onChange={(e) => maj({ maxGrade: Number(e.target.value) })}
          aide="Note maximale d'une evaluation"
        />
        <Champ
          libelle="Moyenne de passage"
          requis
          type="number"
          min={0}
          max={valeurs.maxGrade}
          value={valeurs.passingGrade}
          onChange={(e) => maj({ passingGrade: Number(e.target.value) })}
          aide="Seuil du taux de reussite"
        />
        <Champ
          libelle="Devise"
          requis
          value={valeurs.currency}
          onChange={(e) => maj({ currency: e.target.value })}
        />
      </div>

      <div>
        <Selecteur
          libelle="Effet d'une note sanctionnee sur la moyenne"
          requis
          value={valeurs.penaltyPolicy}
          onChange={(e) => maj({ penaltyPolicy: e.target.value as ParametresEtablissement['penaltyPolicy'] })}
          options={[
            { valeur: 'EXCLUDE_COEFFICIENT', libelle: 'Retirer la note et son coefficient du calcul' },
            { valeur: 'COUNT_AS_ZERO', libelle: 'Compter la note comme un zero, coefficient inclus' },
          ]}
        />
        <Alerte ton="info">
          {valeurs.penaltyPolicy === 'EXCLUDE_COEFFICIENT' ? (
            <>
              La moyenne sera calculee sur les autres evaluations de la matiere. La sanction reste visible
              dans le dossier de l'eleve mais ne fait pas chuter sa moyenne.
            </>
          ) : (
            <>
              La note vaudra zero et son coefficient restera au denominateur. La moyenne de la matiere chutera
              d'autant, proportionnellement au coefficient de l'evaluation.
            </>
          )}
        </Alerte>
      </div>
    </div>
  )
}
