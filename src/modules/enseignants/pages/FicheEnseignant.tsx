/**
 * Fiche enseignant · lot B (Alida)
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Ban, CircleCheck, Link2, Save } from 'lucide-react'
import { useParams } from 'react-router'
import { Bouton, CaseACocher, Champ, DialogueConfirmation, Squelette, useToast } from '../../../ui'
import { GabaritFiche, GrilleInfos, LigneInfo, formaterDate, formaterNomComplet } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Classe, Matiere } from '../../../socle/modeles/scolarite'
import { useAffectations } from '../../affectations/hooks/useAffectations'
import { useChangerStatutEnseignant, useEnseignant, useModifierEnseignant } from '../hooks/useEnseignants'

export default function FicheEnseignant() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const requete = useEnseignant(id)
  const modifier = useModifierEnseignant()
  const changerStatut = useChangerStatutEnseignant()

  const { data: matieres } = useQuery({
    queryKey: ['matieres'],
    queryFn: async () => (await api.get<Matiere[]>('/subjects')).data,
  })
  const { data: classesToutes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<Classe[]>('/classes')).data,
  })
  const affectations = useAffectations({ teacherId: id })

  const [phone, setPhone] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [subjectIds, setSubjectIds] = useState<string[] | null>(null)
  const [desactivationOuverte, setDesactivationOuverte] = useState(false)

  if (requete.isLoading) return <Squelette className="h-96" />
  if (!requete.data) return null

  const enseignant = requete.data
  const telephoneActuel = phone ?? enseignant.phone
  const emailActuel = email ?? enseignant.email ?? ''
  const matieresActuelles = subjectIds ?? enseignant.subjectIds
  const modifie = phone !== null || email !== null || subjectIds !== null

  const basculerMatiere = (matiereId: string) => {
    const base = subjectIds ?? enseignant.subjectIds
    setSubjectIds(base.includes(matiereId) ? base.filter((m) => m !== matiereId) : [...base, matiereId])
  }

  const enregistrer = async () => {
    try {
      await modifier.mutateAsync({
        enseignant,
        modifs: { phone: telephoneActuel, email: emailActuel || undefined, subjectIds: matieresActuelles },
      })
      setPhone(null)
      setEmail(null)
      setSubjectIds(null)
      toast('succes', 'La fiche a été mise à jour.')
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La mise à jour a échoué.')
    }
  }

  return (
    <>
      <GabaritFiche
        titre={formaterNomComplet(enseignant.firstName, enseignant.lastName)}
        filAriane={['Scolarité', 'Enseignants']}
        retour="/enseignants"
        actions={
          <>
            <Bouton
              variante={enseignant.isActive ? 'danger' : 'secondaire'}
              icone={enseignant.isActive ? <Ban className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />}
              chargement={!enseignant.isActive && changerStatut.isPending}
              onClick={async () => {
                if (enseignant.isActive) {
                  setDesactivationOuverte(true)
                  return
                }
                try {
                  await changerStatut.mutateAsync({ enseignant, actif: true })
                  toast('succes', 'Le compte a été réactivé.')
                } catch (e) {
                  toast('danger', (e as { message?: string })?.message ?? 'La réactivation a échoué.')
                }
              }}
            >
              {enseignant.isActive ? 'Désactiver' : 'Réactiver'}
            </Bouton>
            <Bouton
              icone={<Save className="h-4 w-4" />}
              disabled={!modifie}
              chargement={modifier.isPending}
              onClick={enregistrer}
            >
              Enregistrer
            </Bouton>
          </>
        }
        onglets={[
          {
            cle: 'informations',
            libelle: 'Informations',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                <GrilleInfos colonnes={3}>
                  <LigneInfo libelle="Date d'embauche">{formaterDate(enseignant.hireDate)}</LigneInfo>
                  <LigneInfo libelle="Compte utilisateur">
                    {enseignant.userId ? 'Rattaché' : 'Aucun'}
                  </LigneInfo>
                </GrilleInfos>

                <div className="border-line mt-5 grid grid-cols-2 gap-4 border-t pt-4">
                  <Champ
                    libelle="Téléphone"
                    value={telephoneActuel}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Champ
                    libelle="Adresse électronique"
                    type="email"
                    value={emailActuel}
                    onChange={(e) => setEmail(e.target.value)}
                    aide="Facultatif"
                  />
                </div>

                <div className="border-line mt-4 border-t pt-4">
                  <span className="text-ink text-[13px] font-medium">Matières enseignées</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(matieres ?? [])
                      .filter((m) => m.isActive)
                      .map((matiere) => (
                        <CaseACocher
                          key={matiere.id}
                          libelle={matiere.name}
                          checked={matieresActuelles.includes(matiere.id)}
                          onChange={() => basculerMatiere(matiere.id)}
                        />
                      ))}
                  </div>
                </div>
              </div>
            ),
          },
          {
            cle: 'affectations',
            libelle: 'Classes et matières',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                {affectations.isLoading ? (
                  <Squelette className="h-32" />
                ) : (affectations.data ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Link2 className="text-muted h-8 w-8" />
                    <p className="text-muted text-[13px]">
                      Aucune classe affectée pour l'instant. Rendez-vous dans Affectations pour en créer une.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-line border-b text-left">
                        <th className="py-1.5">Classe</th>
                        <th className="py-1.5">Matière</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(affectations.data ?? []).map((a) => (
                        <tr key={a.id} className="border-line border-b last:border-0">
                          <td className="py-1.5">
                            {classesToutes?.find((c) => c.id === a.classId)?.name ?? a.classId}
                          </td>
                          <td className="py-1.5">
                            {matieres?.find((m) => m.id === a.subjectId)?.name ?? a.subjectId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ),
          },
        ]}
      />

      <DialogueConfirmation
        ouverte={desactivationOuverte}
        onFermer={() => setDesactivationOuverte(false)}
        titre="Désactiver cet enseignant"
        message={`${formaterNomComplet(enseignant.firstName, enseignant.lastName)} n'apparaîtra plus dans les sélecteurs d'affectation. Son historique (notes déjà saisies, affectations passées) est conservé.`}
        libelleAction="Désactiver"
        chargement={changerStatut.isPending}
        onConfirmer={async () => {
          await changerStatut.mutateAsync({ enseignant, actif: false })
          toast('succes', 'L\u2019enseignant a été désactivé.')
          setDesactivationOuverte(false)
        }}
      />
    </>
  )
}
