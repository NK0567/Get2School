/**
 * Routes simulées du lot C · PROPRIÉTAIRE : Fabrice
 *
 * Modèle à suivre : routes-administration.ts.
 */
import type MockAdapter from 'axios-mock-adapter'
import { nanoid } from 'nanoid'
import type {
  DonneesBulletin,
  Evaluation,
  EvenementDisciplinaire,
  EvenementPlanifie,
  MoyenneGenerale,
  MoyenneMatiere,
  Note,
  Presence,
} from '../modeles/academique'
import type { AnneeScolaire, Etablissement, Utilisateur } from '../modeles/administration'
import type { Affectation, Classe, Eleve, Enseignant, Inscription, Matiere } from '../modeles/scolarite'
import {
  ajouter,
  collection,
  etablissementCourantDonnees,
  majParId,
  paginer,
  parametres,
  parId,
  remplacer,
} from './base'
import {
  appreciation,
  classerEleves,
  moyenneGenerale as calculerMoyenneGenerale,
  moyenneMatiere as calculerMoyenneMatiere,
  scoreRisque as calculerScoreRisque,
  tauxReussite as calculerTauxReussite,
} from '../../modules/notes/calculs'
import type { NoteAvecCoefficient } from '../../modules/notes/calculs'

/** Déduit l'utilisateur courant du jeton, comme dans routes-administration.ts. */
function utilisateurCourant(config: { headers?: unknown }): Utilisateur | undefined {
  const entetes = (config.headers ?? {}) as Record<string, string>
  const jeton = String(entetes.Authorization ?? '').replace('Bearer ', '')
  const id = jeton.startsWith('demo.') ? jeton.slice(5) : ''
  return collection<Utilisateur>('utilisateurs').find((u) => u.id === id)
}

/**
 * Couples (classe, matière) sur lesquels un enseignant est affecté.
 *
 * RG implicite du lot C : un enseignant ne voit et ne peut agir que sur SES
 * classes ET SA matière. Filtrer uniquement par classe laisserait un
 * enseignant de français voir les évaluations de mathématiques d'un collègue
 * dans une classe qu'ils partagent — deux enseignants affectés à la même
 * classe restent cloisonnés par matière. Cette restriction est appliquée
 * ici, côté serveur, pas seulement grisée dans le SelecteurClasse.
 */
function affectationsDeLEnseignant(userId: string): Set<string> {
  const enseignant = collection<Enseignant>('enseignants').find((e) => e.userId === userId)
  if (!enseignant) return new Set()
  return new Set(
    collection<Affectation>('affectations')
      .filter((a) => a.teacherId === enseignant.id)
      .map((a) => `${a.classId}:${a.subjectId}`),
  )
}

function estAffecte(userId: string, classId: string, subjectId: string): boolean {
  return affectationsDeLEnseignant(userId).has(`${classId}:${subjectId}`)
}

/**
 * Identifiant enseignant lié à un compte utilisateur, ou undefined si aucun.
 */
function enseignantDe(userId: string): string | undefined {
  return collection<Enseignant>('enseignants').find((e) => e.userId === userId)?.id
}

/**
 * Un enseignant voit une évaluation s'il y est actuellement affecté OU s'il
 * en est l'auteur. La seconde condition est essentielle : retirer une
 * affectation en cours d'année ferme la possibilité d'agir sur une classe,
 * mais ne doit jamais faire disparaître de la vue de son auteur un travail
 * déjà produit — même principe que la désactivation d'un enseignant ou
 * l'archivage d'un élève ailleurs dans le projet : l'historique reste
 * visible à qui l'a créé, seule la capacité d'en créer de nouveau se ferme.
 */
function visibleParEnseignant(userId: string, evaluation: Evaluation): boolean {
  if (estAffecte(userId, evaluation.classId, evaluation.subjectId)) return true
  return evaluation.teacherId === enseignantDe(userId)
}

/** RG-08 : une période verrouillée interdit toute modification de note. */
function periodeVerrouillee(periodId: string): boolean {
  const periode = collection<AnneeScolaire>('anneesScolaires')
    .flatMap((a) => a.periods)
    .find((p) => p.id === periodId)
  return Boolean(periode?.isLocked)
}

export function routesAcademique(s: MockAdapter) {
  s.onGet(/^\/evaluations(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const classId = p.get('classId')
    const subjectId = p.get('subjectId')
    const periodId = p.get('periodId')
    const statut = p.get('statut')

    let liste = collection<Evaluation>('evaluations')

    const moi = utilisateurCourant(config)
    if (moi?.role === 'TEACHER') {
      liste = liste.filter((e) => visibleParEnseignant(moi.id, e))
    }

    if (classId) liste = liste.filter((e) => e.classId === classId)
    if (subjectId) liste = liste.filter((e) => e.subjectId === subjectId)
    if (periodId) liste = liste.filter((e) => e.periodId === periodId)
    if (statut) liste = liste.filter((e) => e.status === statut)

    liste = [...liste].sort((a, b) => b.date.localeCompare(a.date))
    return [200, paginer(liste, p)]
  })

  s.onGet('/evaluations/grading-queue').reply((config) => {
    const moi = utilisateurCourant(config)
    if (!moi) return [200, []]

    let mesEvaluations = collection<Evaluation>('evaluations')
    if (moi.role === 'TEACHER') {
      mesEvaluations = mesEvaluations.filter((e) => visibleParEnseignant(moi.id, e))
    }

    const inscriptions = collection<Inscription>('inscriptions')
    const notes = collection<Note>('notes')

    const enrichies = mesEvaluations.map((evaluation) => {
      const effectif = inscriptions.filter(
        (i) => i.classId === evaluation.classId && i.status === 'ACTIVE',
      ).length
      const saisies = notes.filter((n) => n.evaluationId === evaluation.id).length
      return { ...evaluation, effectif, saisies }
    })

    enrichies.sort((a, b) => b.date.localeCompare(a.date))
    return [200, enrichies]
  })

  s.onGet(/^\/evaluations\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const evaluation = parId<Evaluation>('evaluations', id)
    if (!evaluation) return [404, { message: 'Évaluation introuvable.' }]

    const moi = utilisateurCourant(config)
    if (moi?.role === 'TEACHER' && !visibleParEnseignant(moi.id, evaluation)) {
      return [403, { message: "Cette évaluation ne concerne pas l'une de vos classes." }]
    }
    return [200, evaluation]
  })

  s.onPost('/evaluations').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    const moi = utilisateurCourant(config)

    if (moi?.role === 'TEACHER' && !estAffecte(moi.id, corps.classId, corps.subjectId)) {
      return [403, { message: "Vous ne pouvez créer d'évaluation que sur vos propres classes et matières." }]
    }

    const enseignant = collection<Enseignant>('enseignants').find((e) => e.userId === moi?.id)
    const etablissement = etablissementCourantDonnees<Etablissement>()
    const anneeOuverte = collection<AnneeScolaire>('anneesScolaires').find((a) => a.status === 'OPEN')
    if (!anneeOuverte) {
      return [409, { message: 'Aucune année scolaire ouverte : impossible de créer une évaluation.' }]
    }

    const evaluation: Evaluation = {
      ...corps,
      id: `eva-${nanoid(6)}`,
      // Jamais acceptés du client, même principe que le matricule d'un
      // élève : l'établissement et l'année viennent du contexte serveur.
      establishmentId: etablissement.id,
      schoolYearId: anneeOuverte.id,
      teacherId: enseignant?.id ?? 'ens-1',
      status: 'DRAFT',
      maxGrade: Number(corps.maxGrade),
      coefficient: Number(corps.coefficient),
    }
    ajouter('evaluations', evaluation)
    return [201, evaluation]
  })

  s.onPatch(/^\/evaluations\/[\w-]+\/publish$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const evaluation = parId<Evaluation>('evaluations', id)
    if (!evaluation) return [404, { message: 'Évaluation introuvable.' }]
    if (evaluation.status !== 'DRAFT') {
      return [409, { message: 'Seule une évaluation en brouillon peut être publiée.' }]
    }
    // RG-08 : la publication est bloquée si la période est verrouillée.
    return [200, majParId<Evaluation>('evaluations', id, { status: 'PUBLISHED' })]
  })

  s.onGet(/^\/evaluations\/[\w-]+\/grades$/).reply((config) => {
    const evaluationId = (config.url ?? '').split('/')[2]
    return [200, collection<Note>('notes').filter((n) => n.evaluationId === evaluationId)]
  })

  /* ── Saisie des notes ─────────────────────────────────── */

  s.onPut(/^\/evaluations\/[\w-]+\/grades$/).reply((config) => {
    const evaluationId = (config.url ?? '').split('/')[2]
    const evaluation = parId<Evaluation>('evaluations', evaluationId)
    if (!evaluation) return [404, { message: 'Évaluation introuvable.' }]
    if (periodeVerrouillee(evaluation.periodId)) {
      return [423, { message: 'La période est verrouillée : la saisie est bloquée.' }]
    }

    const { saisies } = JSON.parse(config.data ?? '{}') as {
      saisies: { studentId: string; enrollmentId: string; value: number | null; status: Note['status'] }[]
    }

    for (const saisie of saisies) {
      if (
        saisie.status === 'VALID' &&
        saisie.value !== null &&
        (saisie.value < 0 || saisie.value > evaluation.maxGrade)
      ) {
        return [422, { message: `Une note doit être comprise entre 0 et ${evaluation.maxGrade}.` }]
      }
    }

    const toutes = collection<Note>('notes')
    const maintenant = new Date().toISOString()

    for (const saisie of saisies) {
      const existante = toutes.find(
        (n) => n.evaluationId === evaluationId && n.studentId === saisie.studentId,
      )
      if (existante) {
        // Une note ne se supprime pas (RG-07) : on la corrige, avec trace de
        // la modification.
        majParId<Note>('notes', existante.id, {
          value: saisie.value,
          status: saisie.status,
          updatedBy: 'usr-5',
          updatedAt: maintenant,
        })
      } else {
        ajouter<Note>('notes', {
          id: `not-${nanoid(8)}`,
          establishmentId: evaluation.establishmentId,
          evaluationId,
          studentId: saisie.studentId,
          enrollmentId: saisie.enrollmentId,
          value: saisie.value,
          status: saisie.status,
          enteredBy: 'usr-5',
          enteredAt: maintenant,
        })
      }
    }

    return [200, collection<Note>('notes').filter((n) => n.evaluationId === evaluationId)]
  })

  s.onPatch(/^\/grades\/[\w-]+\/penalize$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { motif } = JSON.parse(config.data ?? '{}')
    if (String(motif ?? '').trim().length < 5) {
      return [422, { message: 'Le motif de la sanction est obligatoire.' }]
    }
    const note = parId<Note>('notes', id)
    if (!note) return [404, { message: 'Note introuvable.' }]

    const evaluation = parId<Evaluation>('evaluations', note.evaluationId)
    if (evaluation && periodeVerrouillee(evaluation.periodId)) {
      return [423, { message: 'La période est verrouillée.' }]
    }

    return [
      200,
      majParId<Note>('notes', id, {
        status: 'PENALIZED',
        penaltyReason: motif,
        updatedBy: 'usr-5',
        updatedAt: new Date().toISOString(),
      }),
    ]
  })

  s.onPatch(/^\/grades\/[\w-]+\/unpenalize$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const note = parId<Note>('notes', id)
    if (!note) return [404, { message: 'Note introuvable.' }]
    return [
      200,
      majParId<Note>('notes', id, {
        status: 'VALID',
        penaltyReason: undefined,
        updatedBy: 'usr-5',
        updatedAt: new Date().toISOString(),
      }),
    ]
  })

  /* ── Bulletins ─────────────────────────────────────────── */

  /**
   * Calcule les moyennes par matière et la moyenne générale de tous les
   * élèves actifs d'une classe, sur une période donnée.
   *
   * Ce code vit dans la simulation mais appelle exactement les mêmes
   * fonctions pures que celles testées unitairement (modules/notes/calculs.ts) :
   * c'est ce que Spring Boot devra reproduire, pas une logique différente
   * bricolée pour la démonstration.
   */
  function calculerMoyennesClasse(classId: string, periodId: string) {
    const etablissement = etablissementCourantDonnees<Etablissement>()

    const inscriptions = collection<Inscription>('inscriptions').filter(
      (i) => i.classId === classId && i.status === 'ACTIVE',
    )
    const evaluationsPubliees = collection<Evaluation>('evaluations').filter(
      (e) => e.classId === classId && e.periodId === periodId && e.status === 'PUBLISHED',
    )
    const matieresConcernees = [...new Set(evaluationsPubliees.map((e) => e.subjectId))]
    const toutesLesNotes = collection<Note>('notes')

    // Moyenne de chaque élève dans chaque matière, avant tout classement.
    const moyennesParEleveEtMatiere = new Map<string, Map<string, number | null>>()
    for (const inscription of inscriptions) {
      const parMatiere = new Map<string, number | null>()
      for (const subjectId of matieresConcernees) {
        const evaluationsDeLaMatiere = evaluationsPubliees.filter((e) => e.subjectId === subjectId)
        const notesEleve: NoteAvecCoefficient[] = evaluationsDeLaMatiere
          .map((evaluation) => {
            const note = toutesLesNotes.find(
              (n) => n.evaluationId === evaluation.id && n.studentId === inscription.studentId,
            )
            return note ? { note, coefficientEvaluation: evaluation.coefficient } : null
          })
          .filter((n): n is NoteAvecCoefficient => n !== null)
        parMatiere.set(subjectId, calculerMoyenneMatiere(notesEleve))
      }
      moyennesParEleveEtMatiere.set(inscription.id, parMatiere)
    }

    // Moyenne de classe par matière : sert d'indication de comparaison sur le
    // bulletin, sans influencer le calcul individuel.
    const moyenneClasseParMatiere = new Map<string, number | null>()
    for (const subjectId of matieresConcernees) {
      const valeurs = [...moyennesParEleveEtMatiere.values()]
        .map((m) => m.get(subjectId))
        .filter((v): v is number => v !== null && v !== undefined)
      moyenneClasseParMatiere.set(
        subjectId,
        valeurs.length ? valeurs.reduce((s, v) => s + v, 0) / valeurs.length : null,
      )
    }

    // Moyenne générale de chaque élève, pondérée par le coefficient de matière.
    const matieres = collection<Matiere>('matieres')
    const generalesParEleve = new Map<string, number | null>()
    for (const inscription of inscriptions) {
      const parMatiere = moyennesParEleveEtMatiere.get(inscription.id)!
      const entrees = matieresConcernees.map((subjectId) => ({
        moyenne: parMatiere.get(subjectId) ?? null,
        coefficientMatiere: matieres.find((m) => m.id === subjectId)?.coefficient ?? 1,
      }))
      generalesParEleve.set(inscription.id, calculerMoyenneGenerale(entrees))
    }

    // RG-10 : classement avec ex aequo, rang suivant sauté.
    const classement = classerEleves(
      inscriptions.map((i) => ({ enrollmentId: i.id, moyenne: generalesParEleve.get(i.id) ?? null })),
    )

    return {
      inscriptions,
      matieresConcernees,
      moyennesParEleveEtMatiere,
      moyenneClasseParMatiere,
      generalesParEleve,
      classement,
      etablissement,
    }
  }

  s.onGet(/^\/report-cards\/[\w-]+\/[\w-]+$/).reply((config) => {
    const morceaux = (config.url ?? '').split('/')
    const enrollmentId = morceaux[2]
    const periodId = morceaux[3]

    const inscription = parId<Inscription>('inscriptions', enrollmentId)
    if (!inscription) return [404, { message: 'Inscription introuvable.' }]
    const eleve = parId<Eleve>('eleves', inscription.studentId)
    const classe = parId<Classe>('classes', inscription.classId)
    if (!eleve || !classe) return [404, { message: 'Élève ou classe introuvable.' }]

    const moi = utilisateurCourant(config)
    if (moi?.role === 'TEACHER') {
      const mesMatieres = [...affectationsDeLEnseignant(moi.id)].filter((cle) =>
        cle.startsWith(`${classe.id}:`),
      )
      if (mesMatieres.length === 0) {
        return [403, { message: "Cet élève n'est pas dans l'une de vos classes." }]
      }
    }

    const periode = collection<AnneeScolaire>('anneesScolaires')
      .flatMap((a) => a.periods)
      .find((p) => p.id === periodId)
    const annee = collection<AnneeScolaire>('anneesScolaires').find((a) =>
      a.periods.some((p) => p.id === periodId),
    )

    const {
      matieresConcernees,
      moyennesParEleveEtMatiere,
      moyenneClasseParMatiere,
      generalesParEleve,
      classement,
      inscriptions,
      etablissement,
    } = calculerMoyennesClasse(classe.id, periodId)

    const matieres = collection<Matiere>('matieres')
    const subjects: MoyenneMatiere[] = matieresConcernees.map((subjectId) => {
      const matiere = matieres.find((m) => m.id === subjectId)
      const moyenne = moyennesParEleveEtMatiere.get(enrollmentId)?.get(subjectId) ?? null
      // Rang dans la matière : même principe RG-10, à l'échelle de la matière.
      const rangMatiere = classerEleves(
        inscriptions.map((i) => ({
          enrollmentId: i.id,
          moyenne: moyennesParEleveEtMatiere.get(i.id)?.get(subjectId) ?? null,
        })),
      ).find((r) => r.enrollmentId === enrollmentId)
      return {
        subjectId,
        subjectName: matiere?.name ?? subjectId,
        coefficient: matiere?.coefficient ?? 1,
        average: moyenne,
        classAverage: moyenneClasseParMatiere.get(subjectId) ?? null,
        rank: rangMatiere?.rang ?? null,
        appreciation: appreciation(moyenne),
      }
    })

    const moyenneEleve = generalesParEleve.get(enrollmentId) ?? null
    const rangEleve = classement.find((c) => c.enrollmentId === enrollmentId)?.rang ?? null

    const general: MoyenneGenerale = {
      enrollmentId,
      periodId,
      average: moyenneEleve,
      rank: rangEleve,
      total: inscriptions.length,
      appreciation: appreciation(moyenneEleve),
      passed: moyenneEleve !== null && moyenneEleve >= etablissement.settings.passingGrade,
    }

    // Absences et retards de l'élève, bornés aux dates de la période : un
    // module existe désormais (voir plus bas), ce n'est plus une donnée
    // inventée. La discipline reste à zéro tant que son module n'existe pas.
    const presencesDeLaPeriode = collection<Presence>('presences').filter(
      (pr) =>
        pr.studentId === eleve.id &&
        (!periode || (pr.date >= periode.startDate && pr.date <= periode.endDate)),
    )
    const attendance = {
      absences: presencesDeLaPeriode.filter((pr) => pr.type === 'ABSENCE').length,
      justified: presencesDeLaPeriode.filter((pr) => pr.type === 'ABSENCE' && pr.isJustified).length,
      lateCount: presencesDeLaPeriode.filter((pr) => pr.type === 'LATE').length,
    }

    // Événements disciplinaires de l'élève sur la période : dernière donnée
    // du bulletin qui restait fabriquée à zéro faute de module. Le niveau de
    // gravité le plus élevé est retenu tel quel, sans agrégation : le
    // bulletin ne calcule aucun score, il rapporte les faits.
    const evenementsDeLaPeriode = collection<EvenementDisciplinaire>('evenementsDisciplinaires').filter(
      (ev) =>
        ev.studentId === eleve.id &&
        (!periode || (ev.date >= periode.startDate && ev.date <= periode.endDate)),
    )
    const ordreGravite = { LOW: 0, MEDIUM: 1, HIGH: 2 } as const
    const plusGrave = evenementsDeLaPeriode.reduce<EvenementDisciplinaire | null>(
      (pire, ev) => (!pire || ordreGravite[ev.severity] > ordreGravite[pire.severity] ? ev : pire),
      null,
    )
    const discipline = {
      events: evenementsDeLaPeriode.length,
      highestSeverity: plusGrave?.severity ?? null,
    }

    const donnees: DonneesBulletin = {
      student: {
        matricule: eleve.matricule,
        fullName: `${eleve.lastName.toUpperCase()} ${eleve.firstName}`,
        birthDate: eleve.birthDate,
      },
      classroom: {
        name: classe.name,
        level: classe.level,
        series: classe.series,
        headcount: inscriptions.length,
      },
      period: { label: periode?.label ?? periodId, schoolYear: annee?.label ?? '—' },
      subjects,
      general,
      attendance,
      discipline,
    }

    return [200, donnees]
  })

  s.onGet(/^\/report-cards(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const classId = p.get('classId')
    const periodId = p.get('periodId')
    if (!classId || !periodId) return [200, []]

    // Le classement de toute une classe correspond au privilège du prof
    // titulaire (RG explicite du cahier des charges), plus strict que la
    // simple affectation à une matière qui suffit pour consulter UN
    // bulletin (voir le contrôle juste au-dessus) : ici, seul le titulaire
    // désigné de cette classe précise (Classe.headTeacherId) y a accès.
    const moi = utilisateurCourant(config)
    if (moi?.role === 'TEACHER') {
      const classe = parId<Classe>('classes', classId)
      const monFicheEnseignant = collection<Enseignant>('enseignants').find((e) => e.userId === moi.id)
      if (!classe || classe.headTeacherId !== monFicheEnseignant?.id) {
        return [403, { message: "Vous n'êtes pas le professeur titulaire de cette classe." }]
      }
    }

    const { inscriptions, generalesParEleve, classement } = calculerMoyennesClasse(classId, periodId)
    const eleves = collection<Eleve>('eleves')

    return [
      200,
      inscriptions.map((inscription) => {
        const eleve = eleves.find((e) => e.id === inscription.studentId)
        return {
          enrollmentId: inscription.id,
          matricule: eleve?.matricule ?? '',
          fullName: eleve ? `${eleve.lastName.toUpperCase()} ${eleve.firstName}` : '—',
          average: generalesParEleve.get(inscription.id) ?? null,
          rank: classement.find((c) => c.enrollmentId === inscription.id)?.rang ?? null,
        }
      }),
    ]
  })

  // À compléter : discipline, analyses.

  /* ── Absences et retards ──────────────────────────────── */

  s.onGet(/^\/attendance(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const classId = p.get('classId')
    const studentId = p.get('studentId')
    const type = p.get('type')
    const justifie = p.get('justifie')
    const du = p.get('du')
    const au = p.get('au')

    let liste = [...collection<Presence>('presences')].sort((a, b) => b.date.localeCompare(a.date))

    if (classId) {
      const inscritsDeLaClasse = new Set(
        collection<Inscription>('inscriptions')
          .filter((i) => i.classId === classId && i.status === 'ACTIVE')
          .map((i) => i.studentId),
      )
      liste = liste.filter((pr) => inscritsDeLaClasse.has(pr.studentId))
    }
    if (studentId) liste = liste.filter((pr) => pr.studentId === studentId)
    if (type) liste = liste.filter((pr) => pr.type === type)
    if (justifie !== null && justifie !== '')
      liste = liste.filter((pr) => String(pr.isJustified) === justifie)
    if (du) liste = liste.filter((pr) => pr.date >= du)
    if (au) liste = liste.filter((pr) => pr.date <= au)

    return [200, paginer(liste, p)]
  })

  s.onPost('/attendance/roll-call').reply((config) => {
    const { classId, date, saisies } = JSON.parse(config.data ?? '{}') as {
      classId: string
      date: string
      saisies: {
        studentId: string
        enrollmentId: string
        type: 'ABSENCE' | 'LATE'
        durationMinutes?: number
      }[]
    }

    // Un second appel sur la même classe et la même date remplace les
    // exceptions précédentes : c'est le dernier appel qui fait foi, pas un
    // cumul de doublons.
    const inscritsDeLaClasse = new Set(
      collection<Inscription>('inscriptions')
        .filter((i) => i.classId === classId)
        .map((i) => i.studentId),
    )
    const conservees = collection<Presence>('presences').filter(
      (pr) => !(pr.date === date && inscritsDeLaClasse.has(pr.studentId)),
    )

    const nouvelles: Presence[] = saisies.map((saisie) => ({
      id: `pre-${nanoid(8)}`,
      establishmentId: etablissementCourantDonnees<Etablissement>().id,
      studentId: saisie.studentId,
      enrollmentId: saisie.enrollmentId,
      date,
      type: saisie.type,
      durationMinutes: saisie.type === 'LATE' ? saisie.durationMinutes : undefined,
      isJustified: false,
      recordedBy: 'usr-5',
      recordedAt: new Date().toISOString(),
    }))

    conservees.push(...nouvelles)
    remplacer('presences', conservees)

    return [201, nouvelles]
  })

  s.onPatch(/^\/attendance\/[\w-]+\/justify$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { motif } = JSON.parse(config.data ?? '{}')
    if (String(motif ?? '').trim().length < 5) {
      return [422, { message: 'Le motif du justificatif est obligatoire.' }]
    }
    const maj = majParId<Presence>('presences', id, { isJustified: true, reason: motif })
    return maj ? [200, maj] : [404, { message: 'Absence introuvable.' }]
  })

  /* ── Discipline ────────────────────────────────────────── */

  s.onGet(/^\/discipline(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const classId = p.get('classId')
    const studentId = p.get('studentId')
    const severity = p.get('severity')
    const statut = p.get('statut')

    let liste = [...collection<EvenementDisciplinaire>('evenementsDisciplinaires')].sort((a, b) =>
      b.date.localeCompare(a.date),
    )

    if (classId) {
      const inscritsDeLaClasse = new Set(
        collection<Inscription>('inscriptions')
          .filter((i) => i.classId === classId && i.status === 'ACTIVE')
          .map((i) => i.studentId),
      )
      liste = liste.filter((ev) => inscritsDeLaClasse.has(ev.studentId))
    }
    if (studentId) liste = liste.filter((ev) => ev.studentId === studentId)
    if (severity) liste = liste.filter((ev) => ev.severity === severity)
    if (statut === 'DECIDE') liste = liste.filter((ev) => Boolean(ev.decision))
    if (statut === 'EN_ATTENTE') liste = liste.filter((ev) => !ev.decision)

    return [200, paginer(liste, p)]
  })

  s.onGet(/^\/discipline\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const evenement = parId<EvenementDisciplinaire>('evenementsDisciplinaires', id)
    return evenement ? [200, evenement] : [404, { message: 'Événement introuvable.' }]
  })

  s.onPost('/discipline').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    if (String(corps.description ?? '').trim().length < 10) {
      return [422, { message: 'La description des faits est trop courte.' }]
    }

    const evenement: EvenementDisciplinaire = {
      id: `dis-${nanoid(8)}`,
      establishmentId: etablissementCourantDonnees<Etablissement>().id,
      studentId: corps.studentId,
      enrollmentId: corps.enrollmentId,
      date: corps.date,
      type: corps.type,
      severity: corps.severity,
      description: corps.description,
      reportedBy: 'usr-5',
      createdAt: new Date().toISOString(),
    }
    ajouter('evenementsDisciplinaires', evenement)
    return [201, evenement]
  })

  s.onPatch(/^\/discipline\/[\w-]+\/decide$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { decision } = JSON.parse(config.data ?? '{}')
    if (String(decision ?? '').trim().length < 5) {
      return [422, { message: 'La décision est obligatoire.' }]
    }
    const maj = majParId<EvenementDisciplinaire>('evenementsDisciplinaires', id, {
      decision,
      decidedBy: 'usr-1',
    })
    return maj ? [200, maj] : [404, { message: 'Événement introuvable.' }]
  })

  // À compléter : évolution des apprenants, planning.

  /* ── Élèves à risque ──────────────────────────────────── */

  /** Nombre de jours ouvrés (lundi à samedi) entre deux dates, bornes incluses. */
  function joursOuvresEntre(debut: string, fin: string): number {
    let compte = 0
    const curseur = new Date(debut)
    const limite = new Date(fin)
    while (curseur <= limite) {
      if (curseur.getDay() !== 0) compte += 1 // 0 = dimanche
      curseur.setDate(curseur.getDate() + 1)
    }
    return compte
  }

  s.onGet(/^\/analytics\/at-risk(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const classId = p.get('classId')
    const periodId = p.get('periodId')
    if (!classId || !periodId) return [200, []]

    const etablissement = etablissementCourantDonnees<Etablissement>()
    const poids = etablissement.settings.riskWeights

    const annee = collection<AnneeScolaire>('anneesScolaires').find((a) =>
      a.periods.some((per) => per.id === periodId),
    )
    const periode = annee?.periods.find((per) => per.id === periodId)
    const periodePrecedente = annee?.periods.find((per) => per.order === (periode?.order ?? 0) - 1)

    const { inscriptions, generalesParEleve } = calculerMoyennesClasse(classId, periodId)
    const generalesPeriodePrecedente = periodePrecedente
      ? calculerMoyennesClasse(classId, periodePrecedente.id).generalesParEleve
      : null

    const eleves = collection<Eleve>('eleves')
    const presences = collection<Presence>('presences')
    const evenements = collection<EvenementDisciplinaire>('evenementsDisciplinaires')

    const joursOuvres = periode ? joursOuvresEntre(periode.startDate, periode.endDate) : 1

    const resultats = inscriptions.map((inscription) => {
      const eleve = eleves.find((e) => e.id === inscription.studentId)
      const moyenneActuelle = generalesParEleve.get(inscription.id) ?? null
      const moyennePrecedente = generalesPeriodePrecedente?.get(inscription.id) ?? null

      // Une tendance ne peut être qualifiée que si les deux moyennes existent :
      // sans point de comparaison, on ne pénalise pas l'élève sur ce facteur.
      const tendanceNegative =
        moyenneActuelle !== null && moyennePrecedente !== null && moyenneActuelle < moyennePrecedente

      const joursAbsence = periode
        ? new Set(
            presences
              .filter(
                (pr) =>
                  pr.studentId === inscription.studentId &&
                  pr.type === 'ABSENCE' &&
                  pr.date >= periode.startDate &&
                  pr.date <= periode.endDate,
              )
              .map((pr) => pr.date),
          ).size
        : 0
      const tauxAbsence = joursOuvres > 0 ? joursAbsence / joursOuvres : 0

      const nombreIncidents = periode
        ? evenements.filter(
            (ev) =>
              ev.studentId === inscription.studentId &&
              ev.date >= periode.startDate &&
              ev.date <= periode.endDate,
          ).length
        : 0

      const resultat = calculerScoreRisque(
        { moyenneGenerale: moyenneActuelle, tendanceNegative, tauxAbsence, nombreIncidents },
        poids,
      )

      return {
        enrollmentId: inscription.id,
        studentId: inscription.studentId,
        matricule: eleve?.matricule ?? '',
        fullName: eleve ? `${eleve.lastName.toUpperCase()} ${eleve.firstName}` : '—',
        score: resultat.score,
        level: resultat.niveau,
        factors: resultat.facteurs,
        generalAverage: moyenneActuelle,
      }
    })

    // Les dossiers les plus préoccupants en tête : c'est un tri d'affichage,
    // en aucun cas une file d'attente d'actions à exécuter (RG-16).
    resultats.sort((a, b) => b.score - a.score)

    return [200, resultats]
  })

  // À compléter : rien — Planning des évaluations est implémenté ci-dessous.

  /* ── Planning des évaluations ─────────────────────────── */

  s.onGet(/^\/planning(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const classId = p.get('classId')
    const periodId = p.get('periodId')
    if (!classId) return [200, []]

    // Volontairement toutes matières confondues, sans filtre par enseignant :
    // voir la note en tête de modules/planning/api.ts.
    let liste = collection<Evaluation>('evaluations').filter((e) => e.classId === classId)
    if (periodId) liste = liste.filter((e) => e.periodId === periodId)

    return [200, liste]
  })

  /* ── Évolution des apprenants ─────────────────────────── */

  s.onGet(/^\/analytics\/class-evolution(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const classId = p.get('classId')
    const enrollmentId = p.get('enrollmentId') || undefined
    if (!classId) return [200, { points: [], eleves: [] }]

    const classe = parId<Classe>('classes', classId)
    const annee = collection<AnneeScolaire>('anneesScolaires').find((a) => a.id === classe?.schoolYearId)
    if (!annee) return [200, { points: [], eleves: [] }]

    const points = annee.periods
      .sort((a, b) => a.order - b.order)
      .map((periode) => {
        const { generalesParEleve } = calculerMoyennesClasse(classId, periode.id)
        const moyennes = [...generalesParEleve.values()]
        const classAverage =
          moyennes.filter((m): m is number => m !== null).length > 0
            ? moyennes.filter((m): m is number => m !== null).reduce((s, m) => s + m, 0) /
              moyennes.filter((m): m is number => m !== null).length
            : null
        const passRate = calculerTauxReussite(
          moyennes,
          etablissementCourantDonnees<Etablissement>().settings.passingGrade,
        )
        return {
          periodId: periode.id,
          periodLabel: periode.label,
          classAverage,
          passRate,
          studentAverage: enrollmentId ? (generalesParEleve.get(enrollmentId) ?? null) : null,
        }
      })

    // Élèves de la classe, pour le sélecteur de comparaison : basé sur la
    // dernière période, qui reflète les inscriptions actuellement actives.
    const derniereInscriptions = calculerMoyennesClasse(
      classId,
      annee.periods[annee.periods.length - 1]?.id ?? '',
    ).inscriptions
    const eleves = collection<Eleve>('eleves')
    const listeEleves = derniereInscriptions.map((inscription) => {
      const eleve = eleves.find((e) => e.id === inscription.studentId)
      return {
        enrollmentId: inscription.id,
        matricule: eleve?.matricule ?? '',
        fullName: eleve ? `${eleve.lastName.toUpperCase()} ${eleve.firstName}` : '—',
      }
    })

    return [200, { points, eleves: listeEleves }]
  })

  /* ── Chronogramme ──────────────────────────────────────── */

  s.onGet(/^\/planned-events(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const periodId = p.get('periodId')
    let liste = collection<EvenementPlanifie>('evenementsPlanifies')
    if (periodId) liste = liste.filter((e) => e.periodId === periodId)
    return [200, [...liste].sort((a, b) => a.startDate.localeCompare(b.startDate))]
  })

  s.onPost('/planned-events').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    const etablissement = etablissementCourantDonnees<Etablissement>()
    const anneeOuverte = collection<AnneeScolaire>('anneesScolaires').find((a) => a.status === 'OPEN')
    if (!anneeOuverte) {
      return [409, { message: 'Aucune année scolaire ouverte : impossible de planifier un événement.' }]
    }
    if (String(corps.title ?? '').trim().length < 2) {
      return [422, { message: 'Le titre est obligatoire.' }]
    }

    const evenement: EvenementPlanifie = {
      id: `plan-${nanoid(8)}`,
      establishmentId: etablissement.id,
      schoolYearId: anneeOuverte.id,
      kind: corps.kind,
      title: corps.title,
      classId: corps.classId || undefined,
      subjectId: undefined,
      startDate: corps.startDate,
      endDate: corps.endDate || undefined,
      periodId: corps.periodId || undefined,
      description: corps.description || undefined,
    }
    ajouter('evenementsPlanifies', evenement)
    return [201, evenement]
  })

  s.onDelete(/^\/planned-events\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const existe = parId<EvenementPlanifie>('evenementsPlanifies', id)
    if (!existe) return [404, { message: 'Événement introuvable.' }]
    remplacer(
      'evenementsPlanifies',
      collection<EvenementPlanifie>('evenementsPlanifies').filter((e) => e.id !== id),
    )
    return [204]
  })
}
