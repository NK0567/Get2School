import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alerte, Bouton, Champ, Modale, Selecteur, useToast } from '../../../ui'
import { ChampRecherche, formaterMontant, formaterNomComplet, useDebounce } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Eleve, Inscription } from '../../../socle/modeles/scolarite'
import type { Page } from '../../../socle/modeles/communs'
import { LIBELLE_METHODE } from '../api'
import { useEnregistrerPaiement, useFrais } from '../hooks/useFinances'

export function ModaleNouveauPaiement({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const toast = useToast()
  const enregistrer = useEnregistrerPaiement()
  const { data: frais } = useFrais()

  const [recherche, setRecherche] = useState('')
  const rechercheRetardee = useDebounce(recherche)
  const [eleveChoisi, setEleveChoisi] = useState<Eleve | null>(null)
  const [feeItemId, setFeeItemId] = useState('')
  const [installmentId, setInstallmentId] = useState('')
  const [montant, setMontant] = useState('')
  const [methode, setMethode] = useState<'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CHECK'>('CASH')

  const { data: resultats, isLoading } = useQuery({
    queryKey: ['eleves', 'paiement', rechercheRetardee],
    queryFn: async () =>
      (await api.get<Page<Eleve>>('/students', { params: { recherche: rechercheRetardee, taille: 8 } })).data,
    enabled: rechercheRetardee.trim().length >= 2 && !eleveChoisi,
  })

  const { data: inscriptions } = useQuery({
    queryKey: ['enrollments', 'paiement', eleveChoisi?.id],
    queryFn: async () =>
      (await api.get<Inscription[]>('/enrollments', { params: { studentId: eleveChoisi?.id } })).data,
    enabled: Boolean(eleveChoisi),
  })
  const inscriptionActive = inscriptions?.find((i) => i.status === 'ACTIVE')

  const fraisChoisi = frais?.find((f) => f.id === feeItemId)

  const fermer = () => {
    setRecherche('')
    setEleveChoisi(null)
    setFeeItemId('')
    setInstallmentId('')
    setMontant('')
    setMethode('CASH')
    onFermer()
  }

  const envoyer = async () => {
    if (!eleveChoisi || !inscriptionActive || !feeItemId || !montant) return
    try {
      await enregistrer.mutateAsync({
        studentId: eleveChoisi.id,
        enrollmentId: inscriptionActive.id,
        feeItemId,
        installmentId: installmentId || undefined,
        amount: Number(montant),
        method: methode,
      })
      toast(
        'succes',
        `Paiement enregistré pour ${formaterNomComplet(eleveChoisi.firstName, eleveChoisi.lastName)}.`,
      )
      fermer()
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? "L'enregistrement a échoué.")
    }
  }

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Enregistrer un paiement"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton
            chargement={enregistrer.isPending}
            disabled={!eleveChoisi || !inscriptionActive || !feeItemId || !montant}
            onClick={envoyer}
          >
            Enregistrer et générer le reçu
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

            {!inscriptionActive ? (
              <Alerte ton="alerte">Cet élève n'a aucune inscription active.</Alerte>
            ) : (
              <>
                <Selecteur
                  libelle="Frais concerné"
                  requis
                  value={feeItemId}
                  onChange={(e) => {
                    setFeeItemId(e.target.value)
                    setInstallmentId('')
                  }}
                  placeholder="Choisissez un frais"
                  options={(frais ?? []).map((f) => ({
                    valeur: f.id,
                    libelle: `${f.label} (${formaterMontant(f.amount)})`,
                  }))}
                />
                {fraisChoisi && fraisChoisi.installments.length > 1 && (
                  <Selecteur
                    libelle="Tranche"
                    value={installmentId}
                    onChange={(e) => setInstallmentId(e.target.value)}
                    placeholder="Paiement global, sans tranche précise"
                    options={fraisChoisi.installments.map((t) => ({
                      valeur: t.id,
                      libelle: `${t.label} (${formaterMontant(t.amount)})`,
                    }))}
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Champ
                    libelle="Montant"
                    requis
                    type="number"
                    min={1}
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                  />
                  <Selecteur
                    libelle="Moyen de paiement"
                    requis
                    value={methode}
                    onChange={(e) => setMethode(e.target.value as typeof methode)}
                    options={(Object.keys(LIBELLE_METHODE) as (keyof typeof LIBELLE_METHODE)[]).map((m) => ({
                      valeur: m,
                      libelle: LIBELLE_METHODE[m],
                    }))}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Modale>
  )
}
