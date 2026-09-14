/**
 * Routes simulees du lot B · PROPRIETAIRE : Alida
 *
 * Modèle a suivre : voir routes-administration.ts, notamment la gestion des
 * filtres, de la pagination et des codes d'erreur.
 */
import type MockAdapter from 'axios-mock-adapter'
import type { Classe, Eleve, Enseignant, Inscription, Matiere, Salle } from '../modeles/scolarite'
import { collection, paginer, parametres, parId } from './base'

export function routesScolarite(s: MockAdapter) {
  /* ── Élèves ───────────────────────────────────────────── */
  s.onGet(/\/students(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const recherche = (p.get('recherche') ?? '').toLowerCase()
    let liste = collection<Eleve>('eleves')
    if (recherche) {
      liste = liste.filter((e) =>
        `${e.firstName} ${e.lastName} ${e.matricule}`.toLowerCase().includes(recherche),
      )
    }
    return [200, paginer(liste, p)]
  })

  s.onGet(/\/students\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const eleve = parId<Eleve>('eleves', id)
    return eleve ? [200, eleve] : [404, { message: 'Élève introuvable.' }]
  })

  /* ── Classes, matières, salles, enseignants ───────────── */
  s.onGet(/\/classes(\?.*)?$/).reply(() => [200, collection<Classe>('classes')])
  s.onGet(/\/subjects(\?.*)?$/).reply(() => [200, collection<Matiere>('matieres')])
  s.onGet(/\/rooms(\?.*)?$/).reply(() => [200, collection<Salle>('salles')])
  s.onGet(/\/teachers(\?.*)?$/).reply(() => [200, collection<Enseignant>('enseignants')])

  /* ── Inscriptions ─────────────────────────────────────── */
  s.onGet(/\/enrollments(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const classId = p.get('classId')
    let liste = collection<Inscription>('inscriptions').filter((i) => i.status === 'ACTIVE')
    if (classId) liste = liste.filter((i) => i.classId === classId)
    return [200, liste]
  })

  // A completer : POST /students, POST /enrollments, emploi du temps,
  // frais, paiements, reçus, situation financiere.
}
