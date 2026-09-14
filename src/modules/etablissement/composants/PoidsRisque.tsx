import { Alerte } from '../../../ui'
import type { ParametresEtablissement } from '../../../socle/modeles/administration'
import { formaterPourcentage } from '../../../communs'

interface Props {
  valeurs: ParametresEtablissement['riskWeights']
  onChange: (valeurs: ParametresEtablissement['riskWeights']) => void
}

const FACTEURS: { cle: keyof ParametresEtablissement['riskWeights']; libelle: string; aide: string }[] = [
  { cle: 'average', libelle: 'Moyenne generale', aide: 'Poids de la moyenne dans le score' },
  { cle: 'trend', libelle: 'Tendance', aide: 'Baisse entre deux périodes consecutives' },
  { cle: 'absence', libelle: "Taux d'absence", aide: 'Sature a 20 % de seances manquees' },
  { cle: 'discipline', libelle: 'Incidents disciplinaires', aide: 'Sature a 5 incidents' },
]

/**
 * Ponderations de l'indicateur de risque academique, lues par le lot C.
 * Le total doit faire 100 pour que le score reste interpretable sur 100.
 */
export function PoidsRisque({ valeurs, onChange }: Props) {
  const total = FACTEURS.reduce((somme, f) => somme + valeurs[f.cle], 0)

  return (
    <div className="flex flex-col gap-4">
      {FACTEURS.map((facteur) => (
        <div key={facteur.cle} className="flex items-center gap-4">
          <div className="w-56 shrink-0">
            <div className="text-ink text-sm font-medium">{facteur.libelle}</div>
            <div className="text-muted text-xs">{facteur.aide}</div>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={5}
            value={valeurs[facteur.cle]}
            onChange={(e) => onChange({ ...valeurs, [facteur.cle]: Number(e.target.value) })}
            className="bg-line accent-primary h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
          />
          <span className="text-ink w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
            {valeurs[facteur.cle]}
          </span>
        </div>
      ))}

      {total !== 100 && (
        <Alerte ton="alerte" titre={`Total actuel : ${formaterPourcentage(total)}`}>
          Les ponderations doivent totaliser 100 pour que le score de risque reste lisible sur 100. Ajustez
          avant d'enregistrer.
        </Alerte>
      )}

      <Alerte ton="info">
        Ce score signale les dossiers a examiner. Il ne prononce aucune decision : toute mesure concernant un
        eleve releve des responsables habilites, conformement au reglement de l'etablissement.
      </Alerte>
    </div>
  )
}
