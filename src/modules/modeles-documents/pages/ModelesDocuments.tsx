import { CircleCheck, FileText } from 'lucide-react'
import { Bouton, EnteteDePage, EtatVide, Squelette, useToast } from '../../../ui'
import { BadgeStatut } from '../../../communs'
import type { ModeleDocument } from '../../../socle/modeles/administration'
import { CATEGORIES, TYPES_DOCUMENT, libelleType } from '../../documents/catalogue'
import { useActiverModele, useModeles } from '../../documents/hooks/useDocuments'

/**
 * Un seul modèle actif par type de document. Changer le modèle actif ne
 * modifie aucun document déjà produit : un bulletin imprimé conserve sa mise
 * en page d'origine, ce qui est indispensable pour des pièces officielles
 * déjà remises aux familles.
 */
export default function ModelesDocuments() {
  const toast = useToast()
  const requete = useModeles()
  const activer = useActiverModele()

  if (requete.isLoading) return <Squelette className="h-64" />

  const modeles = (requete.data ?? []) as ModeleDocument[]
  const parType = new Map<string, ModeleDocument[]>()
  for (const modele of modeles) {
    parType.set(modele.type, [...(parType.get(modele.type) ?? []), modele])
  }

  return (
    <>
      <EnteteDePage
        titre="Modèles documentaires"
        sousTitre="Un modèle actif par type de document. Les documents déjà produits ne sont pas modifiés."
        filAriane={['Administration', 'Centre documentaire']}
      />

      {modeles.length === 0 && (
        <EtatVide
          titre="Aucun modèle installé"
          description="Les modèles sont fournis avec la plateforme et installés à la configuration de l'établissement."
          icone={<FileText className="h-8 w-8" />}
        />
      )}

      <div className="flex flex-col gap-6">
        {CATEGORIES.map((categorie) => {
          const types = TYPES_DOCUMENT.filter((t) => t.categorie === categorie && parType.has(t.code))
          if (types.length === 0) return null

          return (
            <div key={categorie}>
              <h2 className="text-muted mb-2 text-[11px] font-semibold tracking-wider uppercase">
                {categorie}
              </h2>
              <div className="flex flex-col gap-3">
                {types.map((type) => (
                  <div key={type.code} className="border-line bg-surface rounded-xl border p-4">
                    <div className="text-ink mb-3 text-sm font-semibold">{libelleType(type.code)}</div>
                    <div className="flex flex-col gap-2">
                      {(parType.get(type.code) ?? []).map((modele) => (
                        <div
                          key={modele.id}
                          className="border-line flex items-center justify-between rounded-lg border px-4 py-2.5"
                        >
                          <div className="flex items-center gap-2.5 text-[13px]">
                            <FileText className="text-muted h-4 w-4" />
                            {modele.name}
                            {modele.isActive && <BadgeStatut valeur="ACTIVE" libelle="Actif" />}
                          </div>
                          {!modele.isActive && (
                            <Bouton
                              variante="secondaire"
                              taille="sm"
                              icone={<CircleCheck className="h-3.5 w-3.5" />}
                              chargement={activer.isPending}
                              onClick={async () => {
                                await activer.mutateAsync({ id: modele.id, libelle: modele.name })
                                toast('succes', `« ${modele.name} » est maintenant le modèle actif.`)
                              }}
                            >
                              Activer
                            </Bouton>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
