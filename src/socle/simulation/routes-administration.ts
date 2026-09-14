/**
 * Routes simulees du lot A · PROPRIETAIRE : Boris
 */
import type MockAdapter from 'axios-mock-adapter'
import { nanoid } from 'nanoid'
import type {
  AnneeScolaire,
  Annonce,
  EntreeAudit,
  Etablissement,
  Notification,
  Utilisateur,
} from '../modeles/administration'
import { ajouter, collection, majParId, paginer, parametres, parId } from './base'

export function routesAdministration(s: MockAdapter) {
  /* ── Authentification ─────────────────────────────────── */
  s.onPost('/auth/login').reply((config) => {
    const { email } = JSON.parse(config.data ?? '{}')
    const utilisateur = collection<Utilisateur>('utilisateurs').find((u) => u.email === email && u.isActive)
    if (!utilisateur) return [401, { message: 'Identifiants incorrects.' }]
    return [200, { jeton: `demo.${utilisateur.id}`, utilisateur }]
  })

  s.onPost('/auth/logout').reply(204)

  /* ── Etablissement ────────────────────────────────────── */
  s.onGet('/establishments/current').reply(() => [200, collection<Etablissement>('etablissements')[0]])

  s.onPut('/establishments/current').reply((config) => {
    const etb = collection<Etablissement>('etablissements')[0]
    const maj = majParId<Etablissement>('etablissements', etb.id, JSON.parse(config.data))
    return [200, maj]
  })

  s.onPost('/establishments/current/setup').reply((config) => {
    const corps = JSON.parse(config.data)
    const etb = collection<Etablissement>('etablissements')[0]

    const maj = majParId<Etablissement>('etablissements', etb.id, {
      ...corps.identite,
      status: 'ACTIVE',
      settings: corps.regles,
    })

    // Cree l'annee scolaire de l'assistant si elle n'existe pas encore.
    const annees = collection<AnneeScolaire>('anneesScolaires')
    if (!annees.some((a) => a.label === corps.academique.anneeLabel)) {
      const id = `an-${nanoid(4)}`
      const nombre = corps.academique.periodType === 'SEMESTER' ? 2 : 3
      const intitule = corps.academique.periodType === 'SEMESTER' ? 'Semestre' : 'Trimestre'
      ajouter<AnneeScolaire>('anneesScolaires', {
        id,
        establishmentId: etb.id,
        label: corps.academique.anneeLabel,
        startDate: corps.academique.startDate,
        endDate: corps.academique.endDate,
        status: 'OPEN',
        periods: Array.from({ length: nombre }, (_, i) => ({
          id: `${id}-p${i + 1}`,
          schoolYearId: id,
          label: `${intitule} ${i + 1}`,
          order: i + 1,
          startDate: corps.academique.startDate,
          endDate: corps.academique.endDate,
          isLocked: false,
        })),
      })
    }

    return [200, maj]
  })

  s.onPut('/establishments/current/settings').reply((config) => {
    const etb = collection<Etablissement>('etablissements')[0]
    const maj = majParId<Etablissement>('etablissements', etb.id, { settings: JSON.parse(config.data) })
    return [200, maj]
  })

  /* ── Utilisateurs ─────────────────────────────────────── */
  s.onGet(/\/users(\?.*)?$/).reply((config) => {
    const p = parametres(config.url)
    const recherche = (p.get('recherche') ?? '').toLowerCase()
    const role = p.get('role')
    const actif = p.get('actif')

    let liste = collection<Utilisateur>('utilisateurs')
    if (recherche) {
      liste = liste.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(recherche))
    }
    if (role) liste = liste.filter((u) => u.role === role)
    if (actif !== null && actif !== '') liste = liste.filter((u) => String(u.isActive) === actif)

    return [200, paginer(liste, p)]
  })

  s.onPost('/users').reply((config) => {
    const corps = JSON.parse(config.data)
    const utilisateur: Utilisateur = {
      id: `usr-${nanoid(6)}`,
      establishmentId: 'etb-1',
      permissions: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      ...corps,
    }
    const doublon = collection<Utilisateur>('utilisateurs').some((u) => u.email === utilisateur.email)
    if (doublon) return [409, { message: 'Cette adresse electronique est deja utilisee.' }]
    ajouter('utilisateurs', utilisateur)
    return [201, utilisateur]
  })

  s.onGet(/\/users\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const u = parId<Utilisateur>('utilisateurs', id)
    return u ? [200, u] : [404, { message: 'Utilisateur introuvable.' }]
  })

  s.onPatch(/\/users\/[\w-]+\/status$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { isActive } = JSON.parse(config.data)
    const maj = majParId<Utilisateur>('utilisateurs', id, { isActive })
    return maj ? [200, maj] : [404, { message: 'Utilisateur introuvable.' }]
  })

  /* ── Annees scolaires et periodes ─────────────────────── */
  s.onGet('/school-years').reply(() => [200, collection<AnneeScolaire>('anneesScolaires')])

  s.onPatch(/\/periods\/[\w-]+\/(lock|unlock)$/).reply((config) => {
    const morceaux = (config.url ?? '').split('/')
    const id = morceaux[2]
    const verrouiller = morceaux[3] === 'lock'
    const annees = collection<AnneeScolaire>('anneesScolaires')
    for (const annee of annees) {
      const periode = annee.periods.find((p) => p.id === id)
      if (periode) {
        periode.isLocked = verrouiller
        majParId<AnneeScolaire>('anneesScolaires', annee.id, { periods: annee.periods })
        return [200, periode]
      }
    }
    return [404, { message: 'Periode introuvable.' }]
  })

  /* ── Journal d'audit ──────────────────────────────────── */
  s.onGet(/\/audit-logs(\?.*)?$/).reply((config) => {
    const p = parametres(config.url)
    const action = p.get('action')
    let liste = [...collection<EntreeAudit>('journalAudit')].reverse()
    if (action) liste = liste.filter((e) => e.action === action)
    return [200, paginer(liste, p)]
  })

  s.onPost('/audit-logs').reply((config) => {
    const entree: EntreeAudit = {
      id: `aud-${nanoid(6)}`,
      establishmentId: 'etb-1',
      createdAt: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      ...JSON.parse(config.data),
    }
    ajouter('journalAudit', entree)
    return [201, entree]
  })

  /* ── Annonces et notifications ────────────────────────── */
  s.onGet(/\/announcements(\?.*)?$/).reply((config) => [
    200,
    paginer(collection<Annonce>('annonces'), parametres(config.url)),
  ])

  s.onGet(/\/notifications(\?.*)?$/).reply(() => [200, collection<Notification>('notifications')])
}
