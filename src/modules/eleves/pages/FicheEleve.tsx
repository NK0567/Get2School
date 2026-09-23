/**
 * Fiche élève · lot B (Alida), alimentée par les trois lots
 *
 * C'est l'écran qui prouve que l'application est intégrée : Identité et
 * Scolarité sont à Alida, Résultats et Vie scolaire lisent les données déjà
 * produites par les modules de Fabrice (bulletins, absences, discipline), et
 * Situation financière lit celles du module Finance d'Alida — tous via
 * leurs API existantes, sans dupliquer aucune règle de calcul.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Ban } from 'lucide-react'
import { useParams } from 'react-router'
import { Badge, Bouton, Squelette, useToast } from '../../../ui'
import {
  BadgeStatut,
  GabaritFiche,
  GrilleInfos,
  LigneInfo,
  formaterDate,
  formaterMontant,
  formaterMoyenne,
  formaterNomComplet,
  formaterRang,
} from '../../../communs'
import { api } from '../../../socle/api/client'
import { useContexteScolaire } from '../../../socle/etat/useContexteScolaire'
import type { Inscription } from '../../../socle/modeles/scolarite'
import { LIBELLE_RELATION, LIBELLE_STATUT } from '../api'
import { useArchiverEleve, useEleve } from '../hooks/useEleves'
import { useBulletin } from '../../bulletins/hooks/useBulletins'
import { useAbsences } from '../../absences/hooks/useAbsences'
import { LIBELLE_TYPE_ABSENCE } from '../../absences/api'
import { useEvenementsDiscipline } from '../../discipline/hooks/useDiscipline'
import { LIBELLE_STATUT_FINANCIER } from '../../finances/api'
import { useSituation } from '../../finances/hooks/useFinances'
import { LIBELLE_GRAVITE, LIBELLE_TYPE as LIBELLE_TYPE_DISCIPLINE } from '../../discipline/api'
import { ModaleArchivage } from '../composants/ModaleArchivage'

export default function FicheEleve() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const { periodeId } = useContexteScolaire()

  const requete = useEleve(id)
  const archiver = useArchiverEleve()
  const [archivageOuvert, setArchivageOuvert] = useState(false)

  const { data: inscriptions } = useQuery({
    queryKey: ['enrollments', 'eleve', id],
    queryFn: async () =>
      (await api.get<Inscription[]>('/enrollments', { params: { studentId: id, tout: 'true' } })).data,
    enabled: Boolean(id),
  })
  const inscriptionActive = inscriptions?.find((i) => i.status === 'ACTIVE')

  const bulletin = useBulletin(inscriptionActive?.id, periodeId ?? undefined)
  const absences = useAbsences({ studentId: id, taille: 5 })
  const discipline = useEvenementsDiscipline({ studentId: id, taille: 5 })
  const situation = useSituation(id)

  if (requete.isLoading) return <Squelette className="h-96" />
  if (!requete.data) return null

  const eleve = requete.data

  return (
    <>
      <GabaritFiche
        titre={formaterNomComplet(eleve.firstName, eleve.lastName)}
        sousTitre={eleve.matricule}
        filAriane={['Scolarité', 'Élèves']}
        retour="/eleves"
        badges={
          <BadgeStatut
            valeur={eleve.status === 'ACTIVE' ? 'ACTIF' : eleve.status}
            libelle={LIBELLE_STATUT[eleve.status]}
          />
        }
        actions={
          eleve.status === 'ACTIVE' && (
            <Bouton
              variante="danger"
              icone={<Ban className="h-4 w-4" />}
              onClick={() => setArchivageOuvert(true)}
            >
              Archiver
            </Bouton>
          )
        }
        onglets={[
          {
            cle: 'identite',
            libelle: 'Identité',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                <GrilleInfos colonnes={3}>
                  <LigneInfo libelle="Matricule">{eleve.matricule}</LigneInfo>
                  <LigneInfo libelle="Date de naissance">{formaterDate(eleve.birthDate)}</LigneInfo>
                  <LigneInfo libelle="Lieu de naissance">{eleve.birthPlace}</LigneInfo>
                  <LigneInfo libelle="Sexe">{eleve.gender === 'M' ? 'Masculin' : 'Féminin'}</LigneInfo>
                  <LigneInfo libelle="Téléphone">{eleve.phone}</LigneInfo>
                  <LigneInfo libelle="Adresse">{eleve.address}</LigneInfo>
                </GrilleInfos>
                <div className="border-line mt-5 border-t pt-4">
                  <h3 className="text-ink mb-2 text-sm font-semibold">Tuteur</h3>
                  <GrilleInfos colonnes={3}>
                    <LigneInfo libelle="Nom">{eleve.guardianName}</LigneInfo>
                    <LigneInfo libelle="Téléphone">{eleve.guardianPhone}</LigneInfo>
                    <LigneInfo libelle="Relation">{LIBELLE_RELATION[eleve.guardianRelationship]}</LigneInfo>
                  </GrilleInfos>
                </div>
              </div>
            ),
          },
          {
            cle: 'scolarite',
            libelle: 'Scolarité',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                {inscriptionActive ? (
                  <GrilleInfos colonnes={3}>
                    <LigneInfo libelle="Classe actuelle">{inscriptionActive.classId}</LigneInfo>
                    <LigneInfo libelle="Inscrit le">{formaterDate(inscriptionActive.enrolledAt)}</LigneInfo>
                    <LigneInfo libelle="Type">
                      {inscriptionActive.isRenewal ? 'Réinscription' : 'Nouvelle inscription'}
                    </LigneInfo>
                  </GrilleInfos>
                ) : (
                  <p className="text-muted text-[13px]">Aucune inscription active.</p>
                )}

                {inscriptions && inscriptions.length > 1 && (
                  <div className="border-line mt-5 border-t pt-4">
                    <h3 className="text-ink mb-2 text-sm font-semibold">Historique</h3>
                    <div className="divide-line flex flex-col divide-y">
                      {inscriptions
                        .filter((i) => i.id !== inscriptionActive?.id)
                        .map((inscription) => (
                          <div
                            key={inscription.id}
                            className="flex items-center justify-between py-2 text-[13px]"
                          >
                            <span>{formaterDate(inscription.enrolledAt)}</span>
                            <BadgeStatut valeur={inscription.status} />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ),
          },
          {
            cle: 'resultats',
            libelle: 'Résultats',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                {!inscriptionActive || !periodeId ? (
                  <p className="text-muted text-[13px]">
                    Sélectionnez une période dans la barre du haut pour afficher les résultats.
                  </p>
                ) : bulletin.isLoading ? (
                  <Squelette className="h-40" />
                ) : bulletin.data ? (
                  <>
                    <GrilleInfos colonnes={3}>
                      <LigneInfo libelle="Moyenne générale">
                        {formaterMoyenne(bulletin.data.general.average)} / 20
                      </LigneInfo>
                      <LigneInfo libelle="Rang">
                        {formaterRang(bulletin.data.general.rank, bulletin.data.general.total)}
                      </LigneInfo>
                      <LigneInfo libelle="Appréciation">{bulletin.data.general.appreciation}</LigneInfo>
                    </GrilleInfos>
                    <div className="border-line mt-4 border-t pt-4">
                      {bulletin.data.subjects.map((matiere) => (
                        <div
                          key={matiere.subjectId}
                          className="flex items-center justify-between py-1.5 text-[13px]"
                        >
                          <span className="text-ink">{matiere.subjectName}</span>
                          <span className="text-muted tabular-nums">
                            {formaterMoyenne(matiere.average)} / 20
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-muted text-[13px]">Aucune donnée pour cette période.</p>
                )}
              </div>
            ),
          },
          {
            cle: 'vie-scolaire',
            libelle: 'Vie scolaire',
            contenu: (
              <div className="flex flex-col gap-4">
                <div className="border-line bg-surface rounded-xl border p-5">
                  <h3 className="text-ink mb-3 text-sm font-semibold">Absences et retards récents</h3>
                  {absences.data && absences.data.contenu.length === 0 ? (
                    <p className="text-muted text-[13px]">Aucune absence enregistrée.</p>
                  ) : (
                    <div className="divide-line flex flex-col divide-y">
                      {absences.data?.contenu.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-2 text-[13px]">
                          <span>
                            {formaterDate(p.date)} · {LIBELLE_TYPE_ABSENCE[p.type]}
                          </span>
                          <BadgeStatut valeur={p.isJustified ? 'ABSENCE_JUSTIFIEE' : p.type} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-line bg-surface rounded-xl border p-5">
                  <h3 className="text-ink mb-3 text-sm font-semibold">Discipline</h3>
                  {discipline.data && discipline.data.contenu.length === 0 ? (
                    <p className="text-muted text-[13px]">Aucun événement disciplinaire.</p>
                  ) : (
                    <div className="divide-line flex flex-col divide-y">
                      {discipline.data?.contenu.map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between py-2 text-[13px]">
                          <span>
                            {formaterDate(ev.date)} · {LIBELLE_TYPE_DISCIPLINE[ev.type]}
                          </span>
                          <span className="text-muted">{LIBELLE_GRAVITE[ev.severity]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            cle: 'finance',
            libelle: 'Situation financière',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                {situation.isLoading ? (
                  <Squelette className="h-32" />
                ) : !situation.data ? (
                  <p className="text-muted text-[13px]">
                    Aucune inscription active pour calculer une situation.
                  </p>
                ) : (
                  <>
                    <GrilleInfos colonnes={3}>
                      <LigneInfo libelle="Dû">{formaterMontant(situation.data.due)}</LigneInfo>
                      <LigneInfo libelle="Payé">{formaterMontant(situation.data.paid)}</LigneInfo>
                      <LigneInfo libelle="Solde">{formaterMontant(situation.data.balance)}</LigneInfo>
                    </GrilleInfos>
                    <div className="border-line mt-4 flex items-center gap-2 border-t pt-4">
                      <BadgeStatut
                        valeur={situation.data.status}
                        libelle={LIBELLE_STATUT_FINANCIER[situation.data.status]}
                      />
                      {situation.data.isOverdue && <Badge ton="danger">En retard</Badge>}
                    </div>
                    {situation.data.nextDueDate && (
                      <p className="text-muted mt-3 text-[13px]">
                        Prochaine échéance non couverte : {formaterDate(situation.data.nextDueDate)}
                      </p>
                    )}
                  </>
                )}
              </div>
            ),
          },
        ]}
      />

      <ModaleArchivage
        eleve={archivageOuvert ? eleve : null}
        onFermer={() => setArchivageOuvert(false)}
        chargement={archiver.isPending}
        onConfirmer={async (motif) => {
          await archiver.mutateAsync({ eleve, motif })
          toast('succes', 'Le dossier a été archivé.')
          setArchivageOuvert(false)
        }}
      />
    </>
  )
}
