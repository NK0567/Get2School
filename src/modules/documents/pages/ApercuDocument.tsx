import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { Alerte, Squelette } from '../../../ui'
import {
  GrilleInfos,
  LigneInfo,
  formaterDate,
  formaterMoyenne,
  formaterNomComplet,
  formaterRang,
  GabaritDocument,
} from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Eleve, Enseignant, Matiere, Salle } from '../../../socle/modeles/scolarite'
import type { CreneauEmploiDuTemps } from '../../../socle/modeles/scolarite'
import type { Inscription } from '../../../socle/modeles/scolarite'
import type { AnneeScolaire, Utilisateur } from '../../../socle/modeles/administration'
import type { EvenementPlanifie } from '../../../socle/modeles/academique'
import type { Page } from '../../../socle/modeles/communs'
import { LIBELLE_ROLE } from '../../../socle/modeles/communs'
import { useBulletin } from '../../bulletins/hooks/useBulletins'
import { LIBELLE_GENRE } from '../../chronogramme/api'
import { LIBELLE_JOUR } from '../../emploi-du-temps/calculs'
import { libelleType, typeDocument } from '../catalogue'
import { useDocument } from '../hooks/useDocuments'

/**
 * Rendu imprimable d'un document produit.
 *
 * Le contenu dépend du VRAI type du document, pas seulement de la présence
 * d'un élève : un bulletin et un certificat de scolarité n'ont pas le même
 * contenu, même s'ils ciblent tous les deux un élève. Les types alimentés
 * par les lots B et C lisent leurs données via leurs endpoints existants —
 * le Centre documentaire ne duplique jamais une règle de calcul, il met en
 * page ce que le module propriétaire a déjà calculé.
 */
export default function ApercuDocument() {
  const { id } = useParams<{ id: string }>()
  const naviguer = useNavigate()
  const requete = useDocument(id)
  const document = requete.data
  const definition = document ? typeDocument(document.type) : undefined

  const estEleve = definition?.cible === 'STUDENT'
  const { data: eleve } = useQuery({
    queryKey: ['eleve', document?.targetId],
    queryFn: async () => (await api.get<Eleve>(`/students/${document?.targetId}`)).data,
    enabled: Boolean(document?.targetId) && estEleve,
  })

  // Un bulletin ou un relevé a besoin de l'inscription active pour lire le
  // calcul déjà fait par le lot C (chargerBulletin prend un enrollmentId,
  // pas un studentId).
  const besoinBulletin = document?.type === 'BULLETIN' || document?.type === 'RELEVE_NOTES'
  const { data: inscriptions } = useQuery({
    queryKey: ['enrollments', 'document', document?.targetId],
    queryFn: async () =>
      (await api.get<Inscription[]>('/enrollments', { params: { studentId: document?.targetId } })).data,
    enabled: Boolean(document?.targetId) && besoinBulletin,
  })
  const inscriptionActive = inscriptions?.find((i) => i.status === 'ACTIVE')
  const bulletin = useBulletin(besoinBulletin ? inscriptionActive?.id : undefined, document?.periodId)

  const estListeClasse = document?.type === 'LISTE_CLASSE'
  const { data: inscritsClasse } = useQuery({
    queryKey: ['enrollments', 'classe-document', document?.targetId],
    queryFn: async () =>
      (await api.get<Inscription[]>('/enrollments', { params: { classId: document?.targetId } })).data,
    enabled: Boolean(document?.targetId) && estListeClasse,
  })
  const { data: elevesDeLaClasse } = useQuery({
    queryKey: ['eleves', 'classe-document'],
    queryFn: async () => (await api.get<Page<Eleve>>('/students', { params: { taille: 500 } })).data,
    enabled: Boolean(inscritsClasse?.length),
  })

  const estChronogramme = document?.type === 'CHRONOGRAMME'
  const { data: evenements } = useQuery({
    queryKey: ['planned-events', 'document'],
    queryFn: async () => (await api.get<EvenementPlanifie[]>('/planned-events')).data,
    enabled: estChronogramme,
  })
  const { data: annees } = useQuery({
    queryKey: ['school-years', 'document'],
    queryFn: async () => (await api.get<AnneeScolaire[]>('/school-years')).data,
    enabled: estChronogramme,
  })
  const periodesAnnee = annees?.find((a) => a.id === document?.schoolYearId)?.periods ?? []

  const estListePersonnel = document?.type === 'LISTE_PERSONNEL'
  const { data: utilisateurs } = useQuery({
    queryKey: ['users', 'document'],
    queryFn: async () => (await api.get<Page<Utilisateur>>('/users', { params: { taille: 200 } })).data,
    enabled: estListePersonnel,
  })
  const { data: enseignantsListe } = useQuery({
    queryKey: ['teachers', 'document'],
    queryFn: async () => (await api.get<Enseignant[]>('/teachers')).data,
    enabled: estListePersonnel,
  })
  const { data: matieresListe } = useQuery({
    queryKey: ['subjects', 'document'],
    queryFn: async () => (await api.get<Matiere[]>('/subjects')).data,
    enabled: estListePersonnel || document?.type === 'EMPLOI_DU_TEMPS_CLASSE',
  })

  const estEmploiDuTempsClasse = document?.type === 'EMPLOI_DU_TEMPS_CLASSE'
  const { data: creneauxClasse } = useQuery({
    queryKey: ['timetable', 'document', document?.targetId],
    queryFn: async () =>
      (await api.get<CreneauEmploiDuTemps[]>('/timetable', { params: { classId: document?.targetId } })).data,
    enabled: Boolean(document?.targetId) && estEmploiDuTempsClasse,
  })
  const { data: sallesListe } = useQuery({
    queryKey: ['rooms', 'document'],
    queryFn: async () => (await api.get<Salle[]>('/rooms')).data,
    enabled: estEmploiDuTempsClasse,
  })

  const boutonRetour = (
    <button
      onClick={() => naviguer(-1)}
      className="text-muted hover:text-ink mb-3 inline-flex items-center gap-1.5 text-[13px] transition print:hidden"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour
    </button>
  )

  if (requete.isLoading) return <Squelette className="h-96" />
  if (!document) return null

  if (document.status === 'CANCELLED') {
    return (
      <>
        {boutonRetour}
        <Alerte ton="danger" titre="Document annulé">
          Ce document porte la référence {document.reference} mais a été annulé. Il ne doit plus être remis ni
          présenté comme valable.
        </Alerte>
      </>
    )
  }

  return (
    <>
      {boutonRetour}
      <GabaritDocument
        reference={document.reference}
        typeLibelle={libelleType(document.type)}
        anneeScolaire={document.schoolYearId}
      >
        {document.type === 'CERTIFICAT_SCOLARITE' && eleve && (
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
              Le Chef d'établissement soussigné atteste que l'élève désigné ci-dessus est régulièrement
              inscrit dans notre établissement au titre de l'année scolaire en cours.
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
        )}

        {(document.type === 'CARTE_SCOLAIRE' || document.type === 'FICHE_ELEVE') && eleve && (
          <GrilleInfos colonnes={2}>
            <LigneInfo libelle="Matricule">{eleve.matricule}</LigneInfo>
            <LigneInfo libelle="Nom et prénom">
              {eleve.lastName.toUpperCase()} {eleve.firstName}
            </LigneInfo>
            <LigneInfo libelle="Date de naissance">{formaterDate(eleve.birthDate)}</LigneInfo>
            <LigneInfo libelle="Lieu de naissance">{eleve.birthPlace}</LigneInfo>
            <LigneInfo libelle="Sexe">{eleve.gender === 'M' ? 'Masculin' : 'Féminin'}</LigneInfo>
            {eleve.phone && <LigneInfo libelle="Téléphone">{eleve.phone}</LigneInfo>}
          </GrilleInfos>
        )}

        {besoinBulletin && (
          <>
            {!inscriptionActive || bulletin.isLoading ? (
              <Squelette className="h-64" />
            ) : bulletin.data ? (
              <>
                {eleve && (
                  <GrilleInfos colonnes={2}>
                    <LigneInfo libelle="Matricule">{eleve.matricule}</LigneInfo>
                    <LigneInfo libelle="Nom et prénom">
                      {eleve.lastName.toUpperCase()} {eleve.firstName}
                    </LigneInfo>
                    <LigneInfo libelle="Classe">{bulletin.data.classroom.name}</LigneInfo>
                    <LigneInfo libelle="Période">{bulletin.data.period.label}</LigneInfo>
                  </GrilleInfos>
                )}

                <table className="mt-5 w-full text-[13px]">
                  <thead>
                    <tr className="border-line border-b text-left">
                      <th className="py-1.5">Matière</th>
                      <th className="py-1.5 text-center">Coef.</th>
                      <th className="py-1.5 text-right">Moyenne</th>
                      <th className="py-1.5 text-center">Rang</th>
                      <th className="py-1.5">Appréciation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulletin.data.subjects.map((matiere) => (
                      <tr key={matiere.subjectId} className="border-line border-b last:border-0">
                        <td className="py-1.5">{matiere.subjectName}</td>
                        <td className="py-1.5 text-center tabular-nums">{matiere.coefficient}</td>
                        <td className="py-1.5 text-right tabular-nums">{formaterMoyenne(matiere.average)}</td>
                        <td className="py-1.5 text-center tabular-nums">{formaterRang(matiere.rank)}</td>
                        <td className="py-1.5">{matiere.appreciation}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-line border-t font-semibold">
                      <td className="py-2" colSpan={2}>
                        Moyenne générale
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formaterMoyenne(bulletin.data.general.average)} / 20
                      </td>
                      <td className="py-2 text-center tabular-nums">
                        {formaterRang(bulletin.data.general.rank, bulletin.data.general.total)}
                      </td>
                      <td className="py-2">{bulletin.data.general.appreciation}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="mt-4 flex gap-6 text-[12px]">
                  <span>
                    Absences : {bulletin.data.attendance.absences} ({bulletin.data.attendance.justified}{' '}
                    justifiée(s))
                  </span>
                  <span>Retards : {bulletin.data.attendance.lateCount}</span>
                </div>

                <div className="mt-12 flex justify-end">
                  <div className="text-center text-[12px]">
                    <div className="text-muted">Le Chef d'établissement</div>
                    <div className="border-line text-muted mt-14 border-t pt-1">Signature et cachet</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted">
                Aucune donnée disponible pour cette période : l'élève n'a peut-être pas d'inscription active.
              </p>
            )}
          </>
        )}

        {estListeClasse && (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-line border-b text-left">
                <th className="py-1.5">Matricule</th>
                <th className="py-1.5">Nom et prénom</th>
              </tr>
            </thead>
            <tbody>
              {(inscritsClasse ?? []).map((inscription) => {
                const eleveDeLaLigne = elevesDeLaClasse?.contenu.find((e) => e.id === inscription.studentId)
                return (
                  <tr key={inscription.id} className="border-line border-b last:border-0">
                    <td className="py-1.5 tabular-nums">{eleveDeLaLigne?.matricule ?? '—'}</td>
                    <td className="py-1.5">
                      {eleveDeLaLigne
                        ? `${eleveDeLaLigne.lastName.toUpperCase()} ${eleveDeLaLigne.firstName}`
                        : inscription.studentId}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {estChronogramme && (
          <div className="flex flex-col gap-5">
            {periodesAnnee.map((periode) => {
              const evenementsPeriode = (evenements ?? [])
                .filter((e) => e.periodId === periode.id)
                .sort((a, b) => a.startDate.localeCompare(b.startDate))
              if (evenementsPeriode.length === 0) return null
              return (
                <div key={periode.id}>
                  <h3 className="text-ink mb-1.5 text-[13px] font-semibold">{periode.label}</h3>
                  <table className="w-full text-[13px]">
                    <tbody>
                      {evenementsPeriode.map((e) => (
                        <tr key={e.id} className="border-line border-b last:border-0">
                          <td className="w-32 py-1 tabular-nums">
                            {formaterDate(e.startDate)}
                            {e.endDate && e.endDate !== e.startDate ? ` – ${formaterDate(e.endDate)}` : ''}
                          </td>
                          <td className="w-24 py-1">{LIBELLE_GENRE[e.kind]}</td>
                          <td className="py-1">{e.title}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}

        {estListePersonnel && (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-line border-b text-left">
                <th className="py-1.5">Nom et prénom</th>
                <th className="py-1.5">Fonction</th>
                <th className="py-1.5">Discipline</th>
                <th className="py-1.5">Téléphone</th>
              </tr>
            </thead>
            <tbody>
              {(utilisateurs?.contenu ?? [])
                .filter((u) => u.isActive)
                .map((u) => {
                  const enseignant = enseignantsListe?.find((e) => e.userId === u.id)
                  const disciplines = enseignant?.subjectIds
                    .map((id) => matieresListe?.find((m) => m.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')
                  return (
                    <tr key={u.id} className="border-line border-b last:border-0">
                      <td className="py-1.5">{formaterNomComplet(u.firstName, u.lastName)}</td>
                      <td className="py-1.5">{LIBELLE_ROLE[u.role]}</td>
                      <td className="py-1.5">{disciplines || '—'}</td>
                      <td className="py-1.5 tabular-nums">{u.phone || enseignant?.phone || '—'}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        )}

        {estEmploiDuTempsClasse && (
          <div className="grid grid-cols-6 gap-2 text-[11px]">
            {[1, 2, 3, 4, 5, 6].map((jour) => (
              <div key={jour}>
                <div className="text-muted mb-1 font-semibold uppercase">{LIBELLE_JOUR[jour]}</div>
                <div className="flex flex-col gap-1">
                  {(creneauxClasse ?? [])
                    .filter((c) => c.dayOfWeek === jour)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((c) => (
                      <div key={c.id} className="border-line rounded border px-1.5 py-1">
                        <div className="font-medium">
                          {c.startTime}–{c.endTime}
                        </div>
                        <div>{matieresListe?.find((m) => m.id === c.subjectId)?.name ?? c.subjectId}</div>
                        <div className="text-muted">{sallesListe?.find((s) => s.id === c.roomId)?.name}</div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!estEleve &&
          !besoinBulletin &&
          !estListeClasse &&
          !estChronogramme &&
          !estListePersonnel &&
          !estEmploiDuTempsClasse && (
            <p className="text-muted">
              Le contenu de ce type de document est fourni par le module {definition?.fourniPar ?? 'concerné'}{' '}
              et sera assemblé ici.
            </p>
          )}
      </GabaritDocument>
    </>
  )
}
