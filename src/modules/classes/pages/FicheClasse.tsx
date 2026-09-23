/**
 * Fiche classe · lot B (Alida)
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link2, Save, Users } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Bouton, Champ, Selecteur, Squelette, useToast } from '../../../ui'
import { GabaritFiche, GrilleInfos, LigneInfo, formaterNomComplet } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Eleve, Enseignant, Inscription, Matiere, Salle } from '../../../socle/modeles/scolarite'
import type { Page } from '../../../socle/modeles/communs'
import { useAffectations } from '../../affectations/hooks/useAffectations'
import { useClasse, useModifierClasse } from '../hooks/useClasses'

export default function FicheClasse() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const requete = useClasse(id)
  const modifier = useModifierClasse()

  const [capacite, setCapacite] = useState<number | null>(null)
  const [salleId, setSalleId] = useState<string | null>(null)
  const [enseignantId, setEnseignantId] = useState<string | null>(null)

  const { data: salles } = useQuery({
    queryKey: ['salles'],
    queryFn: async () => (await api.get<Salle[]>('/rooms')).data,
  })
  const { data: enseignants } = useQuery({
    queryKey: ['enseignants'],
    queryFn: async () => (await api.get<Enseignant[]>('/teachers')).data,
  })

  const { data: inscriptions, isLoading: chargeInscriptions } = useQuery({
    queryKey: ['enrollments', 'classe', id],
    queryFn: async () => (await api.get<Inscription[]>('/enrollments', { params: { classId: id } })).data,
    enabled: Boolean(id),
  })
  const { data: eleves } = useQuery({
    queryKey: ['eleves', 'fiche-classe'],
    queryFn: async () => (await api.get<Page<Eleve>>('/students', { params: { taille: 500 } })).data,
    enabled: Boolean(inscriptions?.length),
  })
  const { data: matieres } = useQuery({
    queryKey: ['matieres'],
    queryFn: async () => (await api.get<Matiere[]>('/subjects')).data,
  })
  const affectations = useAffectations({ classId: id })

  if (requete.isLoading) return <Squelette className="h-96" />
  if (!requete.data) return null

  const classe = requete.data
  const capaciteActuelle = capacite ?? classe.capacity
  const salleActuelle = salleId ?? classe.roomId ?? ''
  const enseignantActuel = enseignantId ?? classe.headTeacherId ?? ''
  const modifie = capacite !== null || salleId !== null || enseignantId !== null

  const enregistrer = async () => {
    try {
      await modifier.mutateAsync({
        classe,
        modifs: {
          capacity: capaciteActuelle,
          roomId: salleActuelle || undefined,
          headTeacherId: enseignantActuel || undefined,
        },
      })
      setCapacite(null)
      setSalleId(null)
      setEnseignantId(null)
      toast('succes', 'La classe a été mise à jour.')
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La mise à jour a échoué.')
    }
  }

  return (
    <GabaritFiche
      titre={classe.name}
      sousTitre={`${classe.level}${classe.series ? ` · ${classe.series}` : ''}`}
      filAriane={['Scolarité', 'Classes']}
      retour="/classes"
      actions={
        <Bouton
          icone={<Save className="h-4 w-4" />}
          disabled={!modifie}
          chargement={modifier.isPending}
          onClick={enregistrer}
        >
          Enregistrer
        </Bouton>
      }
      onglets={[
        {
          cle: 'informations',
          libelle: 'Informations',
          contenu: (
            <div className="border-line bg-surface rounded-xl border p-5">
              <GrilleInfos colonnes={3}>
                <LigneInfo libelle="Niveau">{classe.level}</LigneInfo>
                <LigneInfo libelle="Série">{classe.series ?? '—'}</LigneInfo>
                <LigneInfo libelle="Effectif">
                  {classe.studentCount} / {classe.capacity}
                </LigneInfo>
              </GrilleInfos>

              <div className="border-line mt-5 grid grid-cols-2 gap-4 border-t pt-4">
                <Champ
                  libelle="Capacité"
                  type="number"
                  min={classe.studentCount}
                  value={capaciteActuelle}
                  onChange={(e) => setCapacite(Number(e.target.value))}
                  aide={
                    classe.studentCount > 0
                      ? `Ne peut pas descendre sous ${classe.studentCount} (effectif actuel)`
                      : undefined
                  }
                />
                <Selecteur
                  libelle="Salle"
                  value={salleActuelle}
                  onChange={(e) => setSalleId(e.target.value)}
                  placeholder="Aucune salle attribuée"
                  options={(salles ?? []).map((s) => ({
                    valeur: s.id,
                    libelle: `${s.name} (${s.capacity} places)`,
                  }))}
                />
                <Selecteur
                  libelle="Professeur principal"
                  className="col-span-2"
                  value={enseignantActuel}
                  onChange={(e) => setEnseignantId(e.target.value)}
                  placeholder="Non désigné"
                  options={(enseignants ?? [])
                    .filter((e) => e.isActive)
                    .map((e) => ({ valeur: e.id, libelle: formaterNomComplet(e.firstName, e.lastName) }))}
                />
              </div>
            </div>
          ),
        },
        {
          cle: 'eleves',
          libelle: 'Élèves',
          contenu: (
            <div className="border-line bg-surface rounded-xl border p-5">
              {chargeInscriptions ? (
                <Squelette className="h-48" />
              ) : !inscriptions || inscriptions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Users className="text-muted h-8 w-8" />
                  <p className="text-muted text-[13px]">Aucun élève inscrit dans cette classe.</p>
                </div>
              ) : (
                <div className="divide-line flex flex-col divide-y">
                  {inscriptions.map((inscription) => {
                    const eleve = eleves?.contenu.find((e) => e.id === inscription.studentId)
                    return (
                      <Link
                        key={inscription.id}
                        to={`/eleves/${inscription.studentId}`}
                        className="hover:text-primary flex items-center justify-between py-2.5 text-[13px] transition"
                      >
                        <span className="font-medium">
                          {eleve
                            ? formaterNomComplet(eleve.firstName, eleve.lastName)
                            : inscription.studentId}
                        </span>
                        <span className="text-muted tabular-nums">{eleve?.matricule}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ),
        },
        {
          cle: 'affectations',
          libelle: 'Matières et enseignants',
          contenu: (
            <div className="border-line bg-surface rounded-xl border p-5">
              {affectations.isLoading ? (
                <Squelette className="h-32" />
              ) : (affectations.data ?? []).length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Link2 className="text-muted h-8 w-8" />
                  <p className="text-muted text-[13px]">
                    Aucune matière affectée pour l'instant. Rendez-vous dans Affectations pour en créer une.
                  </p>
                </div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-line border-b text-left">
                      <th className="py-1.5">Matière</th>
                      <th className="py-1.5">Enseignant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(affectations.data ?? []).map((a) => {
                      const enseignant = enseignants?.find((e) => e.id === a.teacherId)
                      return (
                        <tr key={a.id} className="border-line border-b last:border-0">
                          <td className="py-1.5">
                            {matieres?.find((m) => m.id === a.subjectId)?.name ?? a.subjectId}
                          </td>
                          <td className="py-1.5">
                            <Link
                              to={`/enseignants/${a.teacherId}`}
                              className="hover:text-primary transition"
                            >
                              {enseignant
                                ? formaterNomComplet(enseignant.firstName, enseignant.lastName)
                                : a.teacherId}
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ),
        },
      ]}
    />
  )
}
