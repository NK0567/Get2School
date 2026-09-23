/**
 * Registre des absences et retards · lot C (Fabrice)
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, ClipboardCheck } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Bouton, Champ, Selecteur, useToast } from '../../../ui'
import type { Colonne } from '../../../ui'
import {
  BadgeStatut,
  GabaritListe,
  SelecteurClasse,
  formaterDate,
  formaterNomComplet,
  usePagination,
} from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Presence } from '../../../socle/modeles/academique'
import type { Eleve } from '../../../socle/modeles/scolarite'
import type { Page } from '../../../socle/modeles/communs'
import { LIBELLE_TYPE_ABSENCE } from '../api'
import { useAbsences, useJustifierAbsence } from '../hooks/useAbsences'
import { ModaleJustification } from '../composants/ModaleJustification'

export default function ListeAbsences() {
  const toast = useToast()
  const naviguer = useNavigate()
  const { page, taille, setPage, reinitialiser } = usePagination(15)

  const [classId, setClassId] = useState('')
  const [type, setType] = useState<Presence['type'] | ''>('')
  const [justifie, setJustifie] = useState('')
  const [du, setDu] = useState('')
  const [au, setAu] = useState('')
  const [aJustifier, setAJustifier] = useState<Presence | null>(null)

  const requete = useAbsences({ classId, type, justifie, du, au, page, taille })
  const justifier = useJustifierAbsence()

  const { data: eleves } = useQuery({
    queryKey: ['eleves', 'absences'],
    queryFn: async () => (await api.get<Page<Eleve>>('/students', { params: { taille: 500 } })).data,
  })
  const nomEleve = (studentId: string) => {
    const eleve = eleves?.contenu.find((e) => e.id === studentId)
    return eleve ? formaterNomComplet(eleve.firstName, eleve.lastName) : studentId
  }

  const colonnes: Colonne<Presence>[] = [
    {
      cle: 'date',
      entete: 'Date',
      className: 'w-28',
      rendu: (p) => <span className="tabular-nums">{formaterDate(p.date)}</span>,
    },
    {
      cle: 'eleve',
      entete: 'Élève',
      rendu: (p) => nomEleve(p.studentId),
    },
    {
      cle: 'type',
      entete: 'Type',
      rendu: (p) => (
        <span>
          {LIBELLE_TYPE_ABSENCE[p.type]}
          {p.type === 'LATE' && p.durationMinutes ? ` · ${p.durationMinutes} min` : ''}
        </span>
      ),
    },
    {
      cle: 'justification',
      entete: 'Justification',
      rendu: (p) =>
        p.isJustified ? <BadgeStatut valeur="ABSENCE_JUSTIFIEE" /> : <BadgeStatut valeur={p.type} />,
    },
    {
      cle: 'actions',
      entete: '',
      className: 'text-right',
      rendu: (p) =>
        p.isJustified ? (
          <span className="text-muted text-xs" title={p.reason}>
            Justifiée
          </span>
        ) : (
          <Bouton variante="fantome" taille="sm" onClick={() => setAJustifier(p)}>
            Justifier
          </Bouton>
        ),
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Absences et retards"
        sousTitre="Enregistrées lors de l'appel. Seules les exceptions sont listées."
        filAriane={['Académique']}
        actions={
          <Bouton icone={<ClipboardCheck className="h-4 w-4" />} onClick={() => naviguer('/absences/appel')}>
            Faire l'appel
          </Bouton>
        }
        filtres={
          <>
            <SelecteurClasse
              valeur={classId}
              onChange={(v) => {
                setClassId(v)
                reinitialiser()
              }}
            />
            <Selecteur
              value={type}
              onChange={(e) => {
                setType(e.target.value as Presence['type'] | '')
                reinitialiser()
              }}
              placeholder="Absence et retard"
              options={[
                { valeur: 'ABSENCE', libelle: 'Absence' },
                { valeur: 'LATE', libelle: 'Retard' },
              ]}
            />
            <Selecteur
              value={justifie}
              onChange={(e) => {
                setJustifie(e.target.value)
                reinitialiser()
              }}
              placeholder="Justifiée ou non"
              options={[
                { valeur: 'true', libelle: 'Justifiée' },
                { valeur: 'false', libelle: 'Non justifiée' },
              ]}
            />
            <Champ
              type="date"
              value={du}
              onChange={(e) => {
                setDu(e.target.value)
                reinitialiser()
              }}
            />
            <Champ
              type="date"
              value={au}
              onChange={(e) => {
                setAu(e.target.value)
                reinitialiser()
              }}
            />
          </>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data?.contenu}
        colonnes={colonnes}
        cleLigne={(p) => p.id}
        vide={{
          titre: 'Aucune absence enregistrée',
          description: "Utilisez la feuille d'appel pour déclarer une absence ou un retard.",
          icone: <CalendarCheck className="h-8 w-8" />,
          action: <Bouton onClick={() => naviguer('/absences/appel')}>Faire l'appel</Bouton>,
        }}
        pagination={{ page, taille, total: requete.data?.total ?? 0, onChange: setPage }}
      />

      <ModaleJustification
        presence={aJustifier}
        eleveNom={aJustifier ? nomEleve(aJustifier.studentId) : ''}
        onFermer={() => setAJustifier(null)}
        chargement={justifier.isPending}
        onConfirmer={async (motif) => {
          if (!aJustifier) return
          await justifier.mutateAsync({ presence: aJustifier, motif })
          toast('succes', 'Absence marquée comme justifiée.')
          setAJustifier(null)
        }}
      />
    </>
  )
}
