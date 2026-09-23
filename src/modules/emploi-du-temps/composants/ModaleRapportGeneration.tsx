import { AlertTriangle, CircleCheck } from 'lucide-react'
import { Alerte, Bouton, Modale } from '../../../ui'
import type { ResultatGenerationAutomatique } from '../api'

export function ModaleRapportGeneration({
  resultat,
  onFermer,
}: {
  resultat: ResultatGenerationAutomatique | null
  onFermer: () => void
}) {
  return (
    <Modale
      ouverte={resultat !== null}
      onFermer={onFermer}
      titre="Génération automatique terminée"
      pied={<Bouton onClick={onFermer}>Fermer</Bouton>}
    >
      {resultat && (
        <div className="flex flex-col gap-4">
          <Alerte ton={resultat.echecs.length === 0 ? 'info' : 'alerte'}>
            <span className="flex items-center gap-1.5 font-medium">
              {resultat.echecs.length === 0 ? (
                <CircleCheck className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              {resultat.crees} créneau(x) posé(s) sur {resultat.total} nécessaire(s)
            </span>
          </Alerte>

          {resultat.echecs.length > 0 && (
            <div>
              <p className="text-muted mb-2 text-[13px]">
                Aucun créneau libre trouvé pour ces couples classe/matière — à placer à la main, ou à revoir
                (trop peu de salles, ou un enseignant trop chargé) :
              </p>
              <div className="border-line divide-line flex flex-col divide-y rounded-lg border">
                {resultat.echecs.map((e, i) => (
                  <div key={i} className="px-3 py-2 text-[13px]">
                    <div className="font-medium">
                      {e.classe} · {e.matiere}
                    </div>
                    <div className="text-muted text-xs">{e.enseignant}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modale>
  )
}
