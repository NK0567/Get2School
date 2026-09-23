import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alerte, Bouton, Modale, useToast } from '../../../ui'
import { ChampRecherche, SelecteurClasse, formaterNomComplet, useDebounce } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Eleve } from '../../../socle/modeles/scolarite'
import type { Page } from '../../../socle/modeles/communs'
import { useReinscrire } from '../hooks/useInscriptions'

export function ModaleReinscription({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const toast = useToast()
  const reinscrire = useReinscrire()

  const [recherche, setRecherche] = useState('')
  const rechercheRetardee = useDebounce(recherche)
  const [eleveChoisi, setEleveChoisi] = useState<Eleve | null>(null)
  const [classId, setClassId] = useState('')

  const { data: resultats, isLoading } = useQuery({
    queryKey: ['eleves', 'reinscription', rechercheRetardee],
    queryFn: async () =>
      (await api.get<Page<Eleve>>('/students', { params: { recherche: rechercheRetardee, taille: 8 } })).data,
    enabled: rechercheRetardee.trim().length >= 2 && !eleveChoisi,
  })

  const fermer = () => {
    setRecherche('')
    setEleveChoisi(null)
    setClassId('')
    onFermer()
  }

  const envoyer = async () => {
    if (!eleveChoisi || !classId) return
    try {
      await reinscrire.mutateAsync({ studentId: eleveChoisi.id, classId })
      toast('succes', `${formaterNomComplet(eleveChoisi.firstName, eleveChoisi.lastName)} a été réinscrit.`)
      fermer()
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La réinscription a échoué.')
    }
  }

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Réinscrire un élève"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton chargement={reinscrire.isPending} disabled={!eleveChoisi || !classId} onClick={envoyer}>
            Réinscrire
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!eleveChoisi ? (
          <>
            <ChampRecherche
              valeur={recherche}
              onChange={setRecherche}
              placeholder="Nom ou matricule de l'élève"
              className="w-full"
            />
            {isLoading && <p className="text-muted text-[13px]">Recherche…</p>}
            {resultats && resultats.contenu.length > 0 && (
              <div className="divide-line border-line flex flex-col divide-y rounded-lg border">
                {resultats.contenu.map((eleve) => (
                  <button
                    key={eleve.id}
                    type="button"
                    onClick={() => setEleveChoisi(eleve)}
                    className="hover:bg-primary-50 flex items-center justify-between px-3 py-2 text-left text-[13px] transition"
                  >
                    <span className="font-medium">{formaterNomComplet(eleve.firstName, eleve.lastName)}</span>
                    <span className="text-muted">{eleve.matricule}</span>
                  </button>
                ))}
              </div>
            )}
            {resultats && resultats.contenu.length === 0 && rechercheRetardee.trim().length >= 2 && (
              <p className="text-muted text-[13px]">Aucun élève ne correspond à cette recherche.</p>
            )}
          </>
        ) : (
          <>
            <div className="border-line bg-canvas flex items-center justify-between rounded-lg border px-3 py-2.5">
              <div>
                <div className="text-ink text-sm font-medium">
                  {formaterNomComplet(eleveChoisi.firstName, eleveChoisi.lastName)}
                </div>
                <div className="text-muted text-xs">{eleveChoisi.matricule}</div>
              </div>
              <Bouton variante="fantome" taille="sm" onClick={() => setEleveChoisi(null)}>
                Changer
              </Bouton>
            </div>
            <SelecteurClasse libelle="Nouvelle classe" requis valeur={classId} onChange={setClassId} />
            <Alerte ton="info">
              Une nouvelle inscription sera créée sur l'année scolaire ouverte. L'historique des années
              précédentes reste consultable dans le dossier de l'élève.
            </Alerte>
          </>
        )}
      </div>
    </Modale>
  )
}
