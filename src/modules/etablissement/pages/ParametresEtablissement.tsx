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

  // Etat derive : le brouillon n'existe qu'a partir de la premiere modification.
  const valeurs = brouillon ?? etablissement.settings
  const setValeurs = setBrouillon

  const totalPoids = Object.values(valeurs.riskWeights).reduce((a, b) => a + b, 0)
  const modifie = JSON.stringify(valeurs) !== JSON.stringify(etablissement.settings)

  const envoyer = async () => {
    if (valeurs.passingGrade > valeurs.maxGrade) {
      toast('danger', 'La moyenne de passage ne peut pas depasser le bareme.')
      return
    }
    if (totalPoids !== 100) {
      toast('danger', 'Les ponderations du score de risque doivent totaliser 100.')
      return
    }
    try {
      await enregistrer.mutateAsync({ avant: etablissement, parametres: valeurs })
      setBrouillon(null)
      toast('succes', 'Les parametres ont ete enregistres.')
    } catch {
      toast('danger', "L'enregistrement a echoue.")
    }
  }

  return (
    <>
      <EnteteDePage
        titre="Parametres de l'etablissement"
        sousTitre="Ces reglages alimentent les calculs de tous les modules."
        filAriane={['Administration', 'Etablissement']}
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
            libelle: 'Regles de calcul',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                <ReglesCalcul valeurs={valeurs} onChange={setValeurs} />
              </div>
            ),
          },
          {
            cle: 'academique',
            libelle: 'Decoupage academique',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                <div className="max-w-sm">
                  <Selecteur
                    libelle="Decoupage de l'annee"
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
                    Ce choix s'applique aux annees scolaires creees ensuite. Le nombre de periodes d'une annee
                    deja ouverte ne change plus.
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
