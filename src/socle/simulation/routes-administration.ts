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
  // Verrouillage après échecs répétés. Conservé en mémoire ici ; côté Spring
  // Boot, le compteur est persisté et partagé entre les instances, sinon un
  // simple redémarrage suffit à contourner la protection.
  const echecs = new Map<string, { nombre: number; jusqua: number }>()
  const MAX_ECHECS = 5
  const DUREE_BLOCAGE = 15 * 60 * 1000

  // Un message unique pour tous les cas d'échec : adresse inconnue, mot de
  // passe faux ou compte désactivé. Distinguer les trois transformerait le
  // formulaire en outil d'énumération des comptes de l'établissement.
  const ECHEC = { message: 'Adresse électronique ou mot de passe incorrect.' }

  const tracer = (
    action: EntreeAudit['action'],
    userId: string,
    userLabel: string,
    entityLabel: string,
    after: unknown = null,
  ) =>
    ajouter<EntreeAudit>('journalAudit', {
      id: `aud-${nanoid(6)}`,
      establishmentId: 'etb-1',
      userId,
      userLabel,
      action,
      entityType: 'Session',
      entityId: userId,
      entityLabel,
      before: null,
      after,
      createdAt: new Date().toISOString(),
      ipAddress: '127.0.0.1',
    })

  s.onPost('/auth/login').reply((config) => {
    const { email } = JSON.parse(config.data ?? '{}')
    const cle = String(email ?? '').toLowerCase()

    const blocage = echecs.get(cle)
    if (blocage && blocage.jusqua > Date.now()) {
      const minutes = Math.ceil((blocage.jusqua - Date.now()) / 60000)
      return [429, { message: `Trop de tentatives. Réessayez dans ${minutes} minute(s).` }]
    }

    const utilisateur = collection<Utilisateur>('utilisateurs').find(
      (u) => u.email.toLowerCase() === cle && u.isActive,
    )

    if (!utilisateur) {
      const nombre = (blocage?.nombre ?? 0) + 1
      echecs.set(cle, { nombre, jusqua: nombre >= MAX_ECHECS ? Date.now() + DUREE_BLOCAGE : 0 })
      tracer('LOGIN_FAILED', 'inconnu', cle || 'inconnu', cle, { tentative: nombre })
      return [401, ECHEC]
    }

    echecs.delete(cle)
    majParId<Utilisateur>('utilisateurs', utilisateur.id, { lastLoginAt: new Date().toISOString() })
    tracer(
      'LOGIN_SUCCESS',
      utilisateur.id,
      `${utilisateur.firstName} ${utilisateur.lastName}`,
      utilisateur.email,
    )

    return [
      200,
      {
        jeton: `demo.${utilisateur.id}`,
        utilisateur,
        expireLe: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      },
    ]
  })

  s.onPost('/auth/logout').reply(204)

  /* ── Réinitialisation de mot de passe ─────────────────── */

  // Jetons à usage unique, valables trente minutes.
  const jetons = new Map<string, { email: string; expire: number }>()

  s.onPost('/auth/password/forgot').reply((config) => {
    const { email } = JSON.parse(config.data ?? '{}')
    const cle = String(email ?? '').toLowerCase()
    const utilisateur = collection<Utilisateur>('utilisateurs').find(
      (u) => u.email.toLowerCase() === cle && u.isActive,
    )

    // Le jeton n'est créé que si le compte existe, mais la réponse est la même
    // dans les deux cas : 204, sans aucune indication.
    if (utilisateur) {
      const jeton = nanoid(24)
      jetons.set(jeton, { email: utilisateur.email, expire: Date.now() + 30 * 60 * 1000 })
      // En production, ce lien part par courrier électronique et n'apparaît
      // jamais dans la console.
      console.info(`[simulation] lien de réinitialisation : /reinitialiser-mot-de-passe?jeton=${jeton}`)
    }
    return [204]
  })

  s.onGet(/\/auth\/password\/reset\/[\w-]+$/).reply((config) => {
    const jeton = (config.url ?? '').split('/').pop() as string
    const entree = jetons.get(jeton)
    if (!entree || entree.expire < Date.now()) return [200, { valide: false }]
    return [200, { valide: true, email: entree.email }]
  })

  s.onPost('/auth/password/reset').reply((config) => {
    const { jeton, motDePasse } = JSON.parse(config.data ?? '{}')
    const entree = jetons.get(jeton)
    if (!entree || entree.expire < Date.now()) {
      return [410, { message: 'Ce lien est expiré ou a déjà été utilisé.' }]
    }
    if (String(motDePasse ?? '').length < 10) {
      return [422, { message: 'Le mot de passe ne respecte pas la politique de sécurité.' }]
    }
    // Usage unique : le jeton est consommé, une seconde tentative échouera.
    jetons.delete(jeton)
    return [204]
  })

  s.onPut('/auth/password').reply((config) => {
    const { ancien, nouveau } = JSON.parse(config.data ?? '{}')
    if (!ancien) return [401, { message: 'Le mot de passe actuel est incorrect.' }]
    if (String(nouveau ?? '').length < 10) {
      return [422, { message: 'Le mot de passe ne respecte pas la politique de sécurité.' }]
    }
    return [204]
  })

  /* ── Sessions ouvertes ────────────────────────────────── */

  s.onGet('/auth/sessions').reply(() => [
    200,
    [
      {
        id: 'ses-1',
        appareil: 'Chrome · Windows',
        adresseIp: '41.202.219.14',
        derniereActivite: new Date().toISOString(),
        courante: true,
      },
      {
        id: 'ses-2',
        appareil: 'Firefox · Windows',
        adresseIp: '41.202.219.87',
        derniereActivite: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        courante: false,
      },
    ],
  ])

  s.onDelete(/\/auth\/sessions\/[\w-]+$/).reply(204)

  /* ── Établissement ────────────────────────────────────── */
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

    // Créé l'année scolaire de l'assistant si elle n'existe pas encore.
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
    const p = parametres(config)
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
    if (doublon) return [409, { message: 'Cette adresse électronique est déjà utilisée.' }]
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

  /* ── Années scolaires et périodes ─────────────────────── */
  s.onGet('/school-years').reply(() => [200, collection<AnneeScolaire>('anneesScolaires')])

  s.onGet(/\/school-years\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const annee = parId<AnneeScolaire>('anneesScolaires', id)
    return annee ? [200, annee] : [404, { message: 'Année scolaire introuvable.' }]
  })

  s.onPost('/school-years').reply((config) => {
    const corps = JSON.parse(config.data)
    const existe = collection<AnneeScolaire>('anneesScolaires').some((a) => a.label === corps.label)
    if (existe) return [409, { message: `L'annee ${corps.label} existe deja.` }]

    const id = `an-${nanoid(4)}`
    const nombre = corps.periodType === 'SEMESTER' ? 2 : 3
    const intitule = corps.periodType === 'SEMESTER' ? 'Semestre' : 'Trimestre'

    const annee: AnneeScolaire = {
      id,
      establishmentId: 'etb-1',
      label: corps.label,
      startDate: corps.startDate,
      endDate: corps.endDate,
      status: 'DRAFT',
      periods: Array.from({ length: nombre }, (_, i) => ({
        id: `${id}-p${i + 1}`,
        schoolYearId: id,
        label: `${intitule} ${i + 1}`,
        order: i + 1,
        startDate: corps.startDate,
        endDate: corps.endDate,
        isLocked: false,
      })),
    }
    ajouter('anneesScolaires', annee)
    return [201, annee]
  })

  // Une seule année ouverte à la fois : la règle est appliquee côté serveur,
  // pas seulement grisee dans l'interface.
  s.onPatch(/\/school-years\/[\w-]+\/open$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const annee = parId<AnneeScolaire>('anneesScolaires', id)
    if (!annee) return [404, { message: 'Année scolaire introuvable.' }]
    if (annee.status === 'CLOSED') return [409, { message: 'Une année clôturée ne peut pas être rouverte.' }]

    const ouverte = collection<AnneeScolaire>('anneesScolaires').find(
      (a) => a.status === 'OPEN' && a.id !== id,
    )
    if (ouverte) return [409, { message: `L'année ${ouverte.label} est déjà ouverte. Cloturez-la d'abord.` }]

    return [200, majParId<AnneeScolaire>('anneesScolaires', id, { status: 'OPEN' })]
  })

  // La clôture archive : elle verrouille toutes les périodes et ne supprimé rien.
  s.onPatch(/\/school-years\/[\w-]+\/close$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const annee = parId<AnneeScolaire>('anneesScolaires', id)
    if (!annee) return [404, { message: 'Année scolaire introuvable.' }]
    if (annee.status !== 'OPEN') return [409, { message: 'Seule une année ouverte peut être clôturée.' }]

    return [
      200,
      majParId<AnneeScolaire>('anneesScolaires', id, {
        status: 'CLOSED',
        periods: annee.periods.map((p) => ({ ...p, isLocked: true })),
      }),
    ]
  })

  s.onPatch(/\/periods\/[\w-]+\/(lock|unlock)$/).reply((config) => {
    const morceaux = (config.url ?? '').split('/')
    const id = morceaux[2]
    const verrouiller = morceaux[3] === 'lock'

    // RG-08 : le motif de déverrouillage est obligatoire.
    if (!verrouiller) {
      const motif = JSON.parse(config.data ?? '{}').motif ?? ''
      if (String(motif).trim().length < 5) {
        return [422, { message: 'Le motif de déverrouillage est obligatoire.' }]
      }
    }

    const annees = collection<AnneeScolaire>('anneesScolaires')
    for (const annee of annees) {
      const periode = annee.periods.find((p) => p.id === id)
      if (periode) {
        periode.isLocked = verrouiller
        majParId<AnneeScolaire>('anneesScolaires', annee.id, { periods: annee.periods })
        return [200, periode]
      }
    }
    return [404, { message: 'Période introuvable.' }]
  })

  /* ── Journal d'audit ──────────────────────────────────── */
  s.onGet(/\/audit-logs(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const action = p.get('action')
    const userId = p.get('userId')
    const entityType = p.get('entityType')
    const du = p.get('du')
    const au = p.get('au')

    let liste = [...collection<EntreeAudit>('journalAudit')].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )
    if (action) liste = liste.filter((e) => e.action === action)
    if (userId) liste = liste.filter((e) => e.userId === userId)
    if (entityType) liste = liste.filter((e) => e.entityType === entityType)
    if (du) liste = liste.filter((e) => e.createdAt.slice(0, 10) >= du)
    if (au) liste = liste.filter((e) => e.createdAt.slice(0, 10) <= au)

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
    paginer(collection<Annonce>('annonces'), parametres(config)),
  ])

  s.onGet(/\/notifications(\?.*)?$/).reply(() => [200, collection<Notification>('notifications')])
}
