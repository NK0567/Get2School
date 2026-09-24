/**
 * Liste des bulletins · lot C (Fabrice)
 *
 * Sélection d'une classe et d'une période, classement calculé en direct.
 * Cet écran ne génère aucun fichier : il consulte le calcul. La génération
 * officielle du document, avec référence et QR code, se fait depuis le
 * Centre documentaire (Boris), qui lit les mêmes données par ce module.
 *
 * Un enseignant n'y voit que ses propres classes, celles dont il est
 * titulaire (Classe.headTeacherId) — RG explicite du cahier des charges.
 * Le contrôle réel est côté serveur (GET /report-cards) ; ce filtre n'est
 * qu'un confort d'écran pour ne pas proposer un choix qui serait de toute
 * façon refusé.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileBarChart } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Alerte, Badge, Selecteur } from '../../../ui'
import type { Colonne } from '../../../ui'
import {
  GabaritListe,
  SelecteurClasse,
  SelecteurPeriode,
  formaterMoyenne,
  formaterRang,
} from '../../../communs'
import { api } from '../../../socle/api/client'
import { useContexteScolaire } from '../../../socle/etat/useContexteScolaire'
import { useSession } from '../../../socle/etat/useSession'
import type { Classe, Enseignant } from '../../../socle/modeles/scolarite'
import { appreciation } from '../../notes/calculs'
import type { LigneClassement } from '../api'
import { useClassement } from '../hooks/useBulletins'

export default function ListeBulletins() {
  const naviguer = useNavigate()
  const { periodeId } = useContexteScolaire()
  const utilisateur = useSession((e) => e.utilisateur)
  const estEnseignant = utilisateur?.role === 'TEACHER'

  const [classId, setClassId] = useState('')
  const [periode, setPeriode] = useState(periodeId ?? '')
  const selectionComplete = Boolean(classId && periode)

  const { data: mesClasses, isLoading: chargementMesClasses } = useQuery({
    queryKey: ['mes-classes-titulaire', utilisateur?.id],
    queryFn: async () => {
      const [enseignants, classes] = await Promise.all([
        api.get<Enseignant[]>('/teachers'),
        api.get<Classe[]>('/classes'),
      ])
      const moi = enseignants.data.find((e) => e.userId === utilisateur?.id)
      return moi ? classes.data.filter((c) => c.headTeacherId === moi.id) : []
    },
    enabled: estEnseignant,
  })

  const requete = useClassement(classId, periode)

  const colonnes: Colonne<LigneClassement>[] = [
    {
      cle: 'rang',
      entete: 'Rang',
      className: 'w-16',
      rendu: (l) => <span className="text-ink font-semibold tabular-nums">{formaterRang(l.rank)}</span>,
    },
    {
      cle: 'eleve',
      entete: 'Élève',
      rendu: (l) => (
        <div>
          <div className="text-ink font-medium">{l.fullName}</div>
          <div className="text-muted text-xs">{l.matricule}</div>
        </div>
      ),
    },
    {
      cle: 'moyenne',
      entete: 'Moyenne générale',
      className: 'text-right',
      rendu: (l) => <span className="tabular-nums">{formaterMoyenne(l.average)} / 20</span>,
    },
    {
      cle: 'appreciation',
      entete: 'Appréciation',
      rendu: (l) =>
        l.average === null ? (
          <span className="text-muted">—</span>
        ) : (
          <Badge ton="info">{appreciation(l.average)}</Badge>
        ),
    },
  ]

  return (
    <>
      {estEnseignant && !chargementMesClasses && (mesClasses ?? []).length === 0 && (
        <Alerte ton="info">
          Vous n'êtes désigné titulaire d'aucune classe pour l'instant. Seul le titulaire d'une classe peut
          consulter et générer ses bulletins.
        </Alerte>
      )}
      <GabaritListe
        titre="Bulletins"
        sousTitre={
          estEnseignant
            ? 'Vos classes dont vous êtes le professeur titulaire.'
            : 'Moyennes et classement calculés à partir des évaluations publiées.'
        }
        filAriane={['Académique']}
        filtres={
          <>
            {estEnseignant ? (
              <Selecteur
                libelle="Classe"
                requis
                disabled={(mesClasses ?? []).length === 0}
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                placeholder={chargementMesClasses ? 'Chargement…' : 'Choisissez votre classe'}
                options={(mesClasses ?? []).map((c) => ({ valeur: c.id, libelle: c.name }))}
              />
            ) : (
              <SelecteurClasse valeur={classId} onChange={setClassId} requis />
            )}
            <SelecteurPeriode valeur={periode} onChange={setPeriode} requis />
          </>
        }
        chargement={selectionComplete && requete.isLoading}
        erreur={selectionComplete ? requete.error : undefined}
        lignes={selectionComplete ? requete.data : []}
        colonnes={colonnes}
        cleLigne={(l) => l.enrollmentId}
        onLigneCliquee={(l) => naviguer(`/bulletins/${l.enrollmentId}/${periode}`)}
        vide={{
          titre: selectionComplete ? 'Aucun élève classé' : 'Choisissez une classe et une période',
          description: selectionComplete
            ? 'Aucune évaluation publiée sur cette période, ou aucune inscription active dans cette classe.'
            : 'Le classement se calcule sur les évaluations publiées de la période sélectionnée.',
          icone: <FileBarChart className="h-8 w-8" />,
        }}
      />
    </>
  )
}
