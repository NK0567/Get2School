import { useQuery } from '@tanstack/react-query'
import { CircleCheck, CircleX, ShieldQuestion } from 'lucide-react'
import { useParams } from 'react-router'
import { Squelette } from '../../../ui'
import { GrilleInfos, LigneInfo, formaterDateHeure } from '../../../communs'
import { libelleType } from '../catalogue'
import { verifierDocument } from '../api'

/**
 * Page publique de vérification · accessible SANS authentification.
 *
 * Elle répond à une seule question : ce document est-il authentique et
 * toujours valable ? Elle n'expose ni note, ni montant, ni coordonnée, ni
 * aucune donnée personnelle au-delà du nom du titulaire. Toute information
 * supplémentaire transformerait le QR code imprimé sur un bulletin en fuite
 * de données pour quiconque le scanne.
 */
export default function VerificationDocument() {
  const { reference } = useParams<{ reference: string }>()

  const requete = useQuery({
    queryKey: ['verification', reference],
    queryFn: () => verifierDocument(reference as string),
    enabled: Boolean(reference),
    retry: false,
  })

  const resultat = requete.data
  const valide = resultat?.valide && resultat.statut === 'GENERATED'

  return (
    <div className="bg-canvas flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-ink mb-4 text-center text-2xl font-semibold">Get2School</div>

        <div className="border-line bg-surface rounded-xl border p-7">
          <h1 className="text-ink mb-5 text-center text-base font-semibold">Vérification d'un document</h1>

          {requete.isLoading && (
            <div className="flex flex-col gap-2">
              <Squelette className="h-10" />
              <Squelette className="h-24" />
            </div>
          )}

          {!requete.isLoading && !resultat?.valide && (
            <div className="flex flex-col items-center gap-3 text-center">
              <ShieldQuestion className="text-muted h-10 w-10" />
              <p className="text-ink text-sm font-medium">Référence inconnue</p>
              <p className="text-muted text-[13px]">
                Aucun document ne correspond à la référence <code className="text-ink">{reference}</code>.
                Vérifiez la saisie, ou rapprochez-vous de l'établissement émetteur.
              </p>
            </div>
          )}

          {!requete.isLoading && resultat?.valide && (
            <>
              <div className="mb-5 flex flex-col items-center gap-2 text-center">
                {valide ? (
                  <>
                    <CircleCheck className="text-success h-10 w-10" />
                    <p className="text-success text-sm font-semibold">Document authentique</p>
                  </>
                ) : (
                  <>
                    <CircleX className="text-danger h-10 w-10" />
                    <p className="text-danger text-sm font-semibold">Document annulé</p>
                    <p className="text-muted text-[13px]">
                      Ce document a bien été émis par l'établissement, mais il a été annulé depuis. Il ne doit
                      plus être accepté.
                    </p>
                  </>
                )}
              </div>

              <GrilleInfos colonnes={2}>
                <LigneInfo libelle="Référence">
                  <code className="text-[12px]">{resultat.reference}</code>
                </LigneInfo>
                <LigneInfo libelle="Type">{libelleType(resultat.type ?? '')}</LigneInfo>
                <LigneInfo libelle="Établissement">{resultat.etablissement}</LigneInfo>
                <LigneInfo libelle="Année scolaire">{resultat.anneeScolaire}</LigneInfo>
                <LigneInfo libelle="Titulaire">{resultat.titulaire}</LigneInfo>
                <LigneInfo libelle="Émis le">{formaterDateHeure(resultat.emisLe)}</LigneInfo>
              </GrilleInfos>
            </>
          )}
        </div>

        <p className="text-muted mt-4 text-center text-xs">
          Cette page atteste uniquement de l'authenticité d'un document. Elle ne donne accès à aucune donnée
          scolaire, financière ou personnelle.
        </p>
      </div>
    </div>
  )
}
