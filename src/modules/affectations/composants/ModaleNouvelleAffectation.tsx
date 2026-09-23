import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alerte, Bouton, Modale, Selecteur, useToast } from '../../../ui'
import { SelecteurClasse, formaterNomComplet } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Enseignant, Matiere } from '../../../socle/modeles/scolarite'
import { useCreerAffectation } from '../hooks/useAffectations'

/**
 * La matière n'est proposée que parmi celles déclarées sur la fiche de
 * l'enseignant choisi : une affectation sur une matière qu'il n'enseigne
 * pas n'a pas de sens, le formulaire ne permet donc pas de la créer plutôt
 * que de compter sur un contrôle après coup.
 */
export function ModaleNouvelleAffectation({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const toast = useToast()
  const creer = useCreerAffectation()

  const [teacherId, setTeacherId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [classId, setClassId] = useState('')

  const { data: enseignants } = useQuery({
    queryKey: ['enseignants'],
    queryFn: async () => (await api.get<Enseignant[]>('/teachers')).data,
  })
  const { data: matieres } = useQuery({
    queryKey: ['matieres'],
    queryFn: async () => (await api.get<Matiere[]>('/subjects')).data,
  })

  const enseignantChoisi = enseignants?.find((e) => e.id === teacherId)
  const matieresDisponibles = (matieres ?? []).filter(
    (m) => m.isActive && enseignantChoisi?.subjectIds.includes(m.id),
  )

  const fermer = () => {
    setTeacherId('')
    setSubjectId('')
    setClassId('')
    onFermer()
  }

  const envoyer = async () => {
    if (!teacherId || !subjectId || !classId) return
    try {
      await creer.mutateAsync({ teacherId, subjectId, classId })
      toast('succes', "L'affectation a été créée.")
      fermer()
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La création a échoué.')
    }
  }

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Nouvelle affectation"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton
            chargement={creer.isPending}
            disabled={!teacherId || !subjectId || !classId}
            onClick={envoyer}
          >
            Créer l'affectation
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Selecteur
          libelle="Enseignant"
          requis
          value={teacherId}
          onChange={(e) => {
            setTeacherId(e.target.value)
            setSubjectId('')
          }}
          placeholder="Choisissez un enseignant"
          options={(enseignants ?? [])
            .filter((e) => e.isActive)
            .map((e) => ({ valeur: e.id, libelle: formaterNomComplet(e.firstName, e.lastName) }))}
        />

        {teacherId && matieresDisponibles.length === 0 && (
          <Alerte ton="alerte">
            Cet enseignant n'a aucune matière déclarée sur sa fiche. Ajoutez-en une depuis le module
            Enseignants avant de créer une affectation.
          </Alerte>
        )}

        <Selecteur
          libelle="Matière"
          requis
          disabled={!teacherId || matieresDisponibles.length === 0}
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          placeholder={teacherId ? 'Choisissez une matière' : "Choisissez d'abord un enseignant"}
          options={matieresDisponibles.map((m) => ({ valeur: m.id, libelle: m.name }))}
        />

        <SelecteurClasse libelle="Classe" requis valeur={classId} onChange={setClassId} />
      </div>
    </Modale>
  )
}
