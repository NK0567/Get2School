import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleCheck, CircleX, Layers } from 'lucide-react'
import { Alerte, Bouton, EnteteDePage, Selecteur, Squelette, useToast } from '../../../ui'
import { BadgeStatut, SelecteurClasse, SelecteurPeriode } from '../../../communs'
import { api } from '../../../socle/api/client'
import { useContexteScolaire } from '../../../socle/etat/useContexteScolaire'
import { useSession } from '../../../socle/etat/useSession'
import type { DocumentGenere } from '../../../socle/modeles/administration'
import type { Inscription } from '../../../socle/modeles/scolarite'
import type { Eleve } from '../../../socle/modeles/scolarite'
import type { Page } from '../../../socle/modeles/communs'
import { TYPES_DOCUMENT, typeDocument } from '../catalogue'
import { useGenerer } from '../hooks/useDocuments'

/**
 * Génération en lot : produire les bulletins d'une classe entière en une
 * opération. Chaque document a son propre statut : un échec sur un élève
 * n'interrompt pas les autres et reste visible dans le récapitulatif.
 *
 * En production, une génération de cette taille est traitée en arrière-plan
 * par une file de messages, l'écran affichant l'avancement réel.
 */
export default function GenerationLot() {
  const toast = useToast()
  const roleActif = useSession((e) => e.roleActif)
  const { anneeId, periodeId } = useContexteScolaire()
  const generer = useGenerer()

  const [type, setType] = useState('')
  const [classId, setClassId] = useState('')
  const [periode, setPeriode] = useState(periodeId ?? '')
  const [resultats, setResultats] = useState<DocumentGenere[]>([])

  const definition = typeDocument(type)
  const typesEleve = TYPES_DOCUMENT.filter(
    (t) => t.cible === 'STUDENT' && roleActif && t.roles.includes(roleActif),
  )

  const { data: inscriptions, isLoading } = useQuery({
    queryKey: ['inscriptions', classId],
    queryFn: async () => (await api.get<Inscription[]>('/enrollments', { params: { classId } })).data,
    enabled: Boolean(classId),
  })

  const { data: eleves } = useQuery({
    queryKey: ['eleves', 'lot'],
    queryFn: async () => (await api.get<Page<Eleve>>('/students', { params: { taille: 500 } })).data,
    enabled: Boolean(classId),
  })

  const cibles = (inscriptions ?? []).map((inscription) => {
    const eleve = eleves?.contenu.find((e) => e.id === inscription.studentId)
    return {
      id: inscription.studentId,
      libelle: eleve
        ? `${eleve.matricule} · ${eleve.lastName.toUpperCase()} ${eleve.firstName}`
        : inscription.studentId,
    }
  })

  const besoinPeriode = Boolean(definition?.parPeriode)
  const complet = Boolean(type && classId && cibles.length > 0 && (!besoinPeriode || periode))

  const lancer = async () => {
    if (!anneeId) return
    try {
      const resultat = await generer.mutateAsync({
        type,
        cibles,
        schoolYearId: anneeId,
        periodId: besoinPeriode ? periode : undefined,
      })
      setResultats(resultat.documents)
      if (resultat.echoues > 0) {
        toast('alerte', `${resultat.reussis} document(s) produit(s), ${resultat.echoues} en échec.`)
      } else {
        toast('succes', `${resultat.reussis} document(s) produit(s).`)
      }
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La génération a échoué.')
    }
  }

  return (
    <>
      <EnteteDePage
        titre="Génération en lot"
        sousTitre="Produire un même document pour tous les élèves d'une classe."
        filAriane={['Administration', 'Centre documentaire']}
      />

      <div className="border-line bg-surface rounded-xl border p-5">
        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
          <Selecteur
            libelle="Type de document"
            requis
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setResultats([])
            }}
            placeholder="Choisissez un type"
            options={typesEleve.map((t) => ({ valeur: t.code, libelle: t.libelle }))}
          />
          <SelecteurClasse
            libelle="Classe"
            requis
            valeur={classId}
            onChange={(v) => {
              setClassId(v)
              setResultats([])
            }}
            placeholder="Choisissez une classe"
          />
          {besoinPeriode && (
            <SelecteurPeriode libelle="Période" requis valeur={periode} onChange={setPeriode} />
          )}
        </div>

        {classId && isLoading && <Squelette className="mt-4 h-10" />}

        {classId && !isLoading && cibles.length === 0 && (
          <Alerte ton="alerte" titre="Aucun élève inscrit dans cette classe">
            Aucun document ne peut être produit tant que la classe n'a pas d'inscription active pour l'année
            sélectionnée.
          </Alerte>
        )}

        {cibles.length > 0 && (
          <p className="text-muted mt-4 text-[13px]">
            <span className="text-ink font-semibold tabular-nums">{cibles.length}</span> document(s) seront
            produits, un par élève inscrit.
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <Bouton
            chargement={generer.isPending}
            disabled={!complet}
            icone={<Layers className="h-4 w-4" />}
            onClick={lancer}
          >
            Lancer la génération
          </Bouton>
        </div>
      </div>

      {resultats.length > 0 && (
        <div className="border-line bg-surface mt-5 rounded-xl border p-5">
          <h2 className="mb-3 text-base font-semibold">Récapitulatif</h2>
          <div className="divide-line flex flex-col divide-y">
            {resultats.map((document) => (
              <div key={document.id} className="flex items-center justify-between py-2.5 text-[13px]">
                <div className="flex items-center gap-2">
                  {document.status === 'GENERATED' ? (
                    <CircleCheck className="text-success h-4 w-4" />
                  ) : (
                    <CircleX className="text-danger h-4 w-4" />
                  )}
                  <code className="tabular-nums">{document.reference}</code>
                  <span className="text-muted">{document.targetId}</span>
                </div>
                <BadgeStatut valeur={document.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
