/**
 * Routes simulées du lot C · PROPRIÉTAIRE : Fabrice
 *
 * Modèle à suivre : routes-administration.ts.
 */
import type MockAdapter from 'axios-mock-adapter'
import { nanoid } from 'nanoid'
import type { Evaluation, Note } from '../modeles/academique'
import type { AnneeScolaire, Utilisateur } from '../modeles/administration'
import type { Affectation, Enseignant } from '../modeles/scolarite'
import { ajouter, collection, majParId, paginer, parametres, parId } from './base'

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
      liste = liste.filter((e) => estAffecte(moi.id, e.classId, e.subjectId))
    }

    if (classId) liste = liste.filter((e) => e.classId === classId)
    if (subjectId) liste = liste.filter((e) => e.subjectId === subjectId)
    if (periodId) liste = liste.filter((e) => e.periodId === periodId)
    if (statut) liste = liste.filter((e) => e.status === statut)

    liste = [...liste].sort((a, b) => b.date.localeCompare(a.date))
    return [200, paginer(liste, p)]
  })

  s.onGet(/^\/evaluations\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const evaluation = parId<Evaluation>('evaluations', id)
    if (!evaluation) return [404, { message: 'Évaluation introuvable.' }]

    const moi = utilisateurCourant(config)
    if (moi?.role === 'TEACHER' && !estAffecte(moi.id, evaluation.classId, evaluation.subjectId)) {
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

    const evaluation: Evaluation = {
      id: `eva-${nanoid(6)}`,
      establishmentId: 'etb-1',
      schoolYearId: 'an-2026',
      teacherId: enseignant?.id ?? 'ens-1',
      status: 'DRAFT',
      ...corps,
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
          establishmentId: 'etb-1',
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

  // À compléter : calculs de moyennes et de rangs, bulletins, absences,
  // discipline, analyses.
}
