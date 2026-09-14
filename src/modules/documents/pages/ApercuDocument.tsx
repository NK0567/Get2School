import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { Alerte, Squelette } from '../../../ui'
import { GabaritDocument, GrilleInfos, LigneInfo, formaterDate } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Eleve } from '../../../socle/modeles/scolarite'
import { libelleType, typeDocument } from '../catalogue'
import { useDocument } from '../hooks/useDocuments'

/**
 * Rendu imprimable d'un document produit.
 *
 * Le contenu dépend du type. Les types alimentés par les lots B et C lisent
 * leurs données via leurs endpoints : le Centre documentaire ne duplique
 * jamais une règle de calcul ni une donnée métier, il met en page.
 */
export default function ApercuDocument() {
  const { id } = useParams<{ id: string }>()
  const requete = useDocument(id)
  const document = requete.data

  const { data: eleve } = useQuery({
    queryKey: ['eleve', document?.targetId],
    queryFn: async () => (await api.get<Eleve>(`/students/${document?.targetId}`)).data,
    enabled: Boolean(document?.targetId) && typeDocument(document?.type ?? '')?.cible === 'STUDENT',
  })

  if (requete.isLoading) return <Squelette className="h-96" />
  if (!document) return null

  if (document.status === 'CANCELLED') {
    return (
      <Alerte ton="danger" titre="Document annulé">
        Ce document porte la référence {document.reference} mais a été annulé. Il ne doit plus être remis ni
        présenté comme valable.
      </Alerte>
    )
  }

  return (
    <GabaritDocument
      reference={document.reference}
      typeLibelle={libelleType(document.type)}
      anneeScolaire={document.schoolYearId}
    >
      {eleve ? (
        <>
          <GrilleInfos colonnes={2}>
            <LigneInfo libelle="Matricule">{eleve.matricule}</LigneInfo>
            <LigneInfo libelle="Nom et prénom">
              {eleve.lastName.toUpperCase()} {eleve.firstName}
            </LigneInfo>
            <LigneInfo libelle="Date de naissance">{formaterDate(eleve.birthDate)}</LigneInfo>
            <LigneInfo libelle="Lieu de naissance">{eleve.birthPlace}</LigneInfo>
          </GrilleInfos>

          <p className="mt-6 leading-relaxed">
            Le Chef d'établissement soussigné atteste que l'élève désigné ci-dessus est régulièrement inscrit
            dans notre établissement au titre de l'année scolaire en cours.
          </p>
          <p className="mt-3 leading-relaxed">
            La présente attestation est délivrée pour servir et valoir ce que de droit.
          </p>

          <div className="mt-12 flex justify-end">
            <div className="text-center text-[12px]">
              <div className="text-muted">Le Chef d'établissement</div>
              <div className="border-line text-muted mt-14 border-t pt-1">Signature et cachet</div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted">
          Le contenu de ce type de document est fourni par le module{' '}
          {typeDocument(document.type)?.fourniPar ?? 'concerné'} et sera assemblé ici.
        </p>
      )}
    </GabaritDocument>
  )
}
