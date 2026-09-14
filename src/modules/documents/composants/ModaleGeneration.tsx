import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alerte, Bouton, Modale, Selecteur, useToast } from '../../../ui'
import { SelecteurPeriode } from '../../../communs'
import { api } from '../../../socle/api/client'
import { useContexteScolaire } from '../../../socle/etat/useContexteScolaire'
import { useSession } from '../../../socle/etat/useSession'
import type { Classe, Eleve } from '../../../socle/modeles/scolarite'
import type { Page } from '../../../socle/modeles/communs'
import { CATEGORIES, TYPES_DOCUMENT, typeDocument } from '../catalogue'
import { useGenerer } from '../hooks/useDocuments'

interface Props {
  ouverte: boolean
  onFermer: () => void
  /** Type et cible pré-remplis par le module appelant. */
  typeInitial?: string
  cibleInitiale?: string
}

export function ModaleGeneration({ ouverte, onFermer, typeInitial, cibleInitiale }: Props) {
  const toast = useToast()
  const roleActif = useSession((e) => e.roleActif)
  const { anneeId, periodeId } = useContexteScolaire()
  const generer = useGenerer()

  const [type, setType] = useState(typeInitial ?? '')
  const [cible, setCible] = useState(cibleInitiale ?? '')
  const [periode, setPeriode] = useState(periodeId ?? '')

  const definition = typeDocument(type)

  // Un rôle ne voit que les types qu'il a le droit de produire. Le serveur
  // applique la même règle : ce filtre n'est qu'un confort.
  const typesAutorises = TYPES_DOCUMENT.filter((t) => roleActif && t.roles.includes(roleActif))

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<Classe[]>('/classes')).data,
    enabled: definition?.cible === 'CLASS',
  })

  const { data: eleves } = useQuery({
    queryKey: ['eleves', 'selection'],
    queryFn: async () => (await api.get<Page<Eleve>>('/students', { params: { taille: 100 } })).data,
    enabled: definition?.cible === 'STUDENT',
  })

  const optionsCible =
    definition?.cible === 'CLASS'
      ? (classes ?? []).map((c) => ({ valeur: c.id, libelle: c.name }))
      : definition?.cible === 'STUDENT'
        ? (eleves?.contenu ?? []).map((e) => ({
            valeur: e.id,
            libelle: `${e.matricule} · ${e.lastName.toUpperCase()} ${e.firstName}`,
          }))
        : []

  const besoinCible = definition?.cible === 'CLASS' || definition?.cible === 'STUDENT'
  const besoinPeriode = Boolean(definition?.parPeriode)
  const complet = Boolean(type && anneeId && (!besoinCible || cible) && (!besoinPeriode || periode))

  const fermer = () => {
    setType(typeInitial ?? '')
    setCible(cibleInitiale ?? '')
    onFermer()
  }

  const lancer = async () => {
    if (!anneeId) return
    const libelle = optionsCible.find((o) => o.valeur === cible)?.libelle ?? "L'établissement"
    try {
      const resultat = await generer.mutateAsync({
        type,
        cibles: [{ id: cible || 'etablissement', libelle }],
        schoolYearId: anneeId,
        periodId: besoinPeriode ? periode : undefined,
      })
      toast('succes', `${resultat.reussis} document(s) généré(s).`)
      fermer()
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La génération a échoué.')
    }
  }

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Générer un document"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton chargement={generer.isPending} disabled={!complet} onClick={lancer}>
            Générer
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Selecteur
          libelle="Type de document"
          requis
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            setCible('')
          }}
          placeholder="Choisissez un type"
          options={CATEGORIES.flatMap((categorie) =>
            typesAutorises
              .filter((t) => t.categorie === categorie)
              .map((t) => ({ valeur: t.code, libelle: `${categorie} · ${t.libelle}` })),
          )}
        />

        {besoinCible && (
          <Selecteur
            libelle={definition?.cible === 'CLASS' ? 'Classe' : 'Élève'}
            requis
            value={cible}
            onChange={(e) => setCible(e.target.value)}
            placeholder={definition?.cible === 'CLASS' ? 'Choisissez une classe' : 'Choisissez un élève'}
            options={optionsCible}
          />
        )}

        {besoinPeriode && (
          <SelecteurPeriode libelle="Période" requis valeur={periode} onChange={setPeriode} />
        )}

        {definition?.fourniPar && (
          <Alerte ton="info">
            Le contenu de ce document provient du module {definition.fourniPar}. Les informations imprimées
            reflètent les données au moment de la génération.
          </Alerte>
        )}
      </div>
    </Modale>
  )
}
