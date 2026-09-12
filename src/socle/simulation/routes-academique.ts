/**
 * Routes simulees du lot C · PROPRIETAIRE : Fabrice
 *
 * Modele a suivre : voir routes-administration.ts.
 */
import type MockAdapter from 'axios-mock-adapter'
import type { Evaluation, Note } from '../modeles/academique'
import { collection, paginer, parametres } from './base'

export function routesAcademique(s: MockAdapter) {
  s.onGet(/\/evaluations(\?.*)?$/).reply((config) => {
    const p = parametres(config.url)
    const classId = p.get('classId')
    const periodId = p.get('periodId')
    let liste = collection<Evaluation>('evaluations')
    if (classId) liste = liste.filter((e) => e.classId === classId)
    if (periodId) liste = liste.filter((e) => e.periodId === periodId)
    return [200, paginer(liste, p)]
  })

  s.onGet(/\/evaluations\/[\w-]+\/grades$/).reply((config) => {
    const evaluationId = (config.url ?? '').split('/')[2]
    return [200, collection<Note>('notes').filter((n) => n.evaluationId === evaluationId)]
  })

  // A completer : saisie en lot des notes, sanction d'une note, calculs de
  // moyennes et de rangs, bulletins, absences, discipline, analyses.
}
