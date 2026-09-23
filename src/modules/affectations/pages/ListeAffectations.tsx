/**
 * Registre des affectations · lot B (Alida)
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, Users } from 'lucide-react'
import { Bouton, DialogueConfirmation, MenuActions, useToast } from '../../../ui'
import type { ActionMenu, Colonne } from '../../../ui'
import {
  GabaritListe,
  SelecteurClasse,
  SelecteurEnseignant,
  SelecteurMatiere,
  formaterNomComplet,
} from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Affectation, Classe, Enseignant, Matiere } from '../../../socle/modeles/scolarite'
import { useAffectations, useRetirerAffectation } from '../hooks/useAffectations'
import { ModaleNouvelleAffectation } from '../composants/ModaleNouvelleAffectation'

export default function ListeAffectations() {
  const toast = useToast()
  const [classId, setClassId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [creationOuverte, setCreationOuverte] = useState(false)
  const [aRetirer, setARetirer] = useState<Affectation | null>(null)

  const requete = useAffectations({ classId, teacherId, subjectId })
  const retirer = useRetirerAffectation()

  const { data: enseignants } = useQuery({
    queryKey: ['enseignants'],
    queryFn: async () => (await api.get<Enseignant[]>('/teachers')).data,
  })
  const { data: matieres } = useQuery({
    queryKey: ['matieres'],
    queryFn: async () => (await api.get<Matiere[]>('/subjects')).data,
  })
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get<Classe[]>('/classes')).data,
  })

  const nomEnseignant = (id: string) => {
    const e = enseignants?.find((x) => x.id === id)
    return e ? formaterNomComplet(e.firstName, e.lastName) : id
  }
  const nomMatiere = (id: string) => matieres?.find((m) => m.id === id)?.name ?? id
  const nomClasse = (id: string) => classes?.find((c) => c.id === id)?.name ?? id

  const colonnes: Colonne<Affectation>[] = [
    { cle: 'enseignant', entete: 'Enseignant', rendu: (a) => nomEnseignant(a.teacherId) },
    { cle: 'matiere', entete: 'Matière', rendu: (a) => nomMatiere(a.subjectId) },
    { cle: 'classe', entete: 'Classe', rendu: (a) => nomClasse(a.classId) },
    {
      cle: 'actions',
      entete: '',
      className: 'text-right',
      rendu: (a) => (
        <MenuActions
          actions={[
            {
              libelle: "Retirer l'affectation",
              icone: <Trash2 className="h-4 w-4" />,
              destructif: true,
              onClick: () => setARetirer(a),
            } satisfies ActionMenu,
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Affectations"
        sousTitre={`${requete.data?.length ?? 0} affectation(s) sur l'année en cours`}
        filAriane={['Scolarité']}
        actions={
          <Bouton icone={<Plus className="h-4 w-4" />} onClick={() => setCreationOuverte(true)}>
            Nouvelle affectation
          </Bouton>
        }
        filtres={
          <>
            <SelecteurEnseignant valeur={teacherId} onChange={setTeacherId} />
            <SelecteurMatiere valeur={subjectId} onChange={setSubjectId} />
            <SelecteurClasse valeur={classId} onChange={setClassId} />
          </>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data}
        colonnes={colonnes}
        cleLigne={(a) => a.id}
        vide={{
          titre: 'Aucune affectation',
          description: 'Créez la première affectation enseignant, matière, classe.',
          icone: <Users className="h-8 w-8" />,
          action: <Bouton onClick={() => setCreationOuverte(true)}>Nouvelle affectation</Bouton>,
        }}
      />

      <ModaleNouvelleAffectation ouverte={creationOuverte} onFermer={() => setCreationOuverte(false)} />

      <DialogueConfirmation
        ouverte={aRetirer !== null}
        onFermer={() => setARetirer(null)}
        titre="Retirer cette affectation"
        message={
          aRetirer
            ? `${nomEnseignant(aRetirer.teacherId)} ne pourra plus créer d'évaluation sur ${nomMatiere(aRetirer.subjectId)} pour ${nomClasse(aRetirer.classId)}. Les évaluations déjà créées restent inchangées.`
            : ''
        }
        libelleAction="Retirer l'affectation"
        chargement={retirer.isPending}
        onConfirmer={async () => {
          if (!aRetirer) return
          await retirer.mutateAsync(aRetirer.id)
          toast('succes', "L'affectation a été retirée.")
          setARetirer(null)
        }}
      />
    </>
  )
}
