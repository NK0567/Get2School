import { useEffect, useState } from 'react'
import { GraduationCap, School, Search, UserCog, Users, FileText } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'
import { Badge, EnteteDePage, EtatVide, Squelette, cn } from '../../../ui'
import { ChampRecherche, useDebounce } from '../../../communs'
import { LIBELLE_TYPE, LONGUEUR_MINIMALE } from '../api'
import type { ResultatRecherche, TypeResultat } from '../api'
import { useRecherche } from '../hooks/useRecherche'

const ICONES: Record<TypeResultat, typeof Users> = {
  ELEVE: GraduationCap,
  ENSEIGNANT: UserCog,
  CLASSE: School,
  UTILISATEUR: Users,
  DOCUMENT: FileText,
}

export default function RechercheGlobale() {
  const naviguer = useNavigate()
  const [parametres, setParametres] = useSearchParams()

  const [terme, setTerme] = useState(parametres.get('q') ?? '')
  const [types, setTypes] = useState<TypeResultat[]>([])
  const termeRetarde = useDebounce(terme, 300)

  // L'URL porte la recherche : un résultat se partage et se remet en favori.
  useEffect(() => {
    const actuel = parametres.get('q') ?? ''
    if (termeRetarde !== actuel) {
      setParametres(termeRetarde ? { q: termeRetarde } : {}, { replace: true })
    }
  }, [termeRetarde, parametres, setParametres])

  const requete = useRecherche(termeRetarde, types)
  const reponse = requete.data
  const trop_court = termeRetarde.trim().length < LONGUEUR_MINIMALE

  const parType = new Map<TypeResultat, ResultatRecherche[]>()
  for (const resultat of reponse?.resultats ?? []) {
    parType.set(resultat.type, [...(parType.get(resultat.type) ?? []), resultat])
  }

  const basculerType = (type: TypeResultat) =>
    setTypes((actuels) => (actuels.includes(type) ? actuels.filter((t) => t !== type) : [...actuels, type]))

  return (
    <div className="mx-auto max-w-3xl">
      <EnteteDePage
        titre="Recherche"
        sousTitre="Élèves, enseignants, classes, comptes et documents de votre établissement."
      />

      <ChampRecherche
        valeur={terme}
        onChange={setTerme}
        placeholder="Nom, matricule, classe, référence de document…"
        className="w-full"
      />

      {reponse && reponse.typesAutorises.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {reponse.typesAutorises.map((type) => (
            <button
              key={type}
              onClick={() => basculerType(type)}
              className={cn(
                'rounded-full border px-3 py-1 text-[12px] transition',
                types.includes(type)
                  ? 'border-primary bg-primary-50 text-primary font-medium'
                  : 'border-line text-muted hover:text-ink',
              )}
            >
              {LIBELLE_TYPE[type]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5">
        {trop_court && (
          <EtatVide
            titre="Saisissez au moins deux caractères"
            description="La recherche porte sur les noms, les matricules, les intitulés de classe et les références de documents."
            icone={<Search className="h-8 w-8" />}
          />
        )}

        {!trop_court && requete.isLoading && (
          <div className="flex flex-col gap-2">
            <Squelette className="h-14" />
            <Squelette className="h-14" />
            <Squelette className="h-14" />
          </div>
        )}

        {!trop_court && !requete.isLoading && reponse && reponse.total === 0 && (
          <EtatVide
            titre={`Aucun résultat pour « ${termeRetarde.trim()} »`}
            description="Vérifiez l'orthographe, ou cherchez par matricule."
            icone={<Search className="h-8 w-8" />}
          />
        )}

        {!trop_court && reponse && reponse.total > 0 && (
          <>
            <p className="text-muted mb-3 text-[13px]">
              <span className="text-ink font-semibold tabular-nums">{reponse.total}</span> résultat(s)
            </p>

            <div className="flex flex-col gap-5">
              {[...parType.entries()].map(([type, resultats]) => {
                const Icone = ICONES[type]
                return (
                  <div key={type}>
                    <h2 className="text-muted mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
                      <Icone className="h-3.5 w-3.5" />
                      {LIBELLE_TYPE[type]}
                      <Badge ton="neutre">{resultats.length}</Badge>
                    </h2>
                    <div className="flex flex-col gap-1.5">
                      {resultats.map((resultat) => (
                        <button
                          key={`${resultat.type}-${resultat.id}`}
                          onClick={() => naviguer(resultat.route)}
                          className="border-line bg-surface hover:border-primary/40 hover:bg-primary-50 flex items-baseline justify-between gap-3 rounded-lg border px-4 py-3 text-left transition"
                        >
                          <span className="text-ink truncate text-sm font-medium">{resultat.titre}</span>
                          {resultat.precision && (
                            <span className="text-muted shrink-0 text-xs">{resultat.precision}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <p className="text-muted mt-6 text-xs">
        Les résultats sont limités aux données de votre établissement et à ce que votre rôle vous autorise à
        consulter.
      </p>
    </div>
  )
}
