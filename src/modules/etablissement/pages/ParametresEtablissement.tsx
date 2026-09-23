import { useState } from 'react'
import { Bouton, EnteteDePage, Selecteur, SqueletteTableau, useToast } from '../../../ui'
import { GabaritFiche } from '../../../communs'
import type { ParametresEtablissement as Parametres } from '../../../socle/modeles/administration'
import { useEnregistrerParametres, useEtablissement } from '../hooks/useEtablissement'
import { ReglesCalcul } from '../composants/ReglesCalcul'
import { PoidsRisque } from '../composants/PoidsRisque'

export default function ParametresEtablissement() {
  const toast = useToast()
  const { data: etablissement, isLoading } = useEtablissement()
  const enregistrer = useEnregistrerParametres()
  const [brouillon, setBrouillon] = useState<Parametres | null>(null)

  if (isLoading || !etablissement) return <SqueletteTableau lignes={5} />

  // État derive : le brouillon n'existe qu'à partir de la première modification.
  const valeurs = brouillon ?? etablissement.settings
  const setValeurs = setBrouillon

  const totalPoids = Object.values(valeurs.riskWeights).reduce((a, b) => a + b, 0)
  const modifie = JSON.stringify(valeurs) !== JSON.stringify(etablissement.settings)

  const envoyer = async () => {
    if (valeurs.passingGrade > valeurs.maxGrade) {
      toast('danger', 'La moyenne de passage ne peut pas dépasser le barème.')
      return
    }
    if (totalPoids !== 100) {
      toast('danger', 'Les pondérations du score de risque doivent totaliser 100.')
      return
    }
    try {
      await enregistrer.mutateAsync({ avant: etablissement, parametres: valeurs })
      setBrouillon(null)
      toast('succes', 'Les paramètres ont été enregistres.')
    } catch {
      toast('danger', "L'enregistrement à échoué.")
    }
  }

  return (
    <>
      <EnteteDePage
        titre="Paramètres de l'établissement"
        sousTitre="Ces reglages alimentent les calculs de tous les modules."
        filAriane={['Administration', 'Établissement']}
        actions={
          <Bouton chargement={enregistrer.isPending} disabled={!modifie} onClick={envoyer}>
            Enregistrer
          </Bouton>
        }
      />

      <GabaritFiche
        titre=""
        onglets={[
          {
            cle: 'calcul',
            libelle: 'Règles de calcul',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                <ReglesCalcul valeurs={valeurs} onChange={setValeurs} />
              </div>
            ),
          },
          {
            cle: 'academique',
            libelle: 'Découpage académique',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                <div className="max-w-sm">
                  <Selecteur
                    libelle="Découpage de l'année"
                    requis
                    value={valeurs.periodType}
                    onChange={(e) =>
                      setValeurs({ ...valeurs, periodType: e.target.value as Parametres['periodType'] })
                    }
                    options={[
                      { valeur: 'TRIMESTER', libelle: '3 trimestres' },
                      { valeur: 'SEMESTER', libelle: '2 semestres' },
                    ]}
                  />
                  <p className="text-muted mt-2 text-xs">
                    Ce choix s'applique aux années scolaires créées ensuite. Le nombre de périodes d'une année
                    déjà ouverte ne change plus.
                  </p>
                </div>
              </div>
            ),
          },
          {
            cle: 'risque',
            libelle: 'Indicateur de risque',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                <PoidsRisque
                  valeurs={valeurs.riskWeights}
                  onChange={(riskWeights) => setValeurs({ ...valeurs, riskWeights })}
                />
              </div>
            ),
          },
        ]}
      />
    </>
  )
}
