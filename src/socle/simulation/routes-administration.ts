/**
 * Routes simulees du lot A · PROPRIETAIRE : Boris
 */
import type MockAdapter from 'axios-mock-adapter'
import { nanoid } from 'nanoid'
import type {
  AnneeScolaire,
  Annonce,
  DocumentGenere,
  EntreeAudit,
  Etablissement,
  ModeleDocument,
  Notification,
  Utilisateur,
} from '../modeles/administration'
import type { Affectation, Classe, Eleve, Enseignant, Inscription } from '../modeles/scolarite'
import { ajouter, collection, majParId, paginer, parametres, parId, remplacer } from './base'

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

  s.onGet(/^\/auth\/password\/reset\/[\w-]+$/).reply((config) => {
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

  s.onDelete(/^\/auth\/sessions\/[\w-]+$/).reply(204)

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
  s.onGet(/^\/users(\?.*)?$/).reply((config) => {
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

  s.onGet(/^\/users\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const u = parId<Utilisateur>('utilisateurs', id)
    return u ? [200, u] : [404, { message: 'Utilisateur introuvable.' }]
  })

  s.onPatch(/^\/users\/[\w-]+\/status$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { isActive } = JSON.parse(config.data)
    const maj = majParId<Utilisateur>('utilisateurs', id, { isActive })
    return maj ? [200, maj] : [404, { message: 'Utilisateur introuvable.' }]
  })

  /* ── Années scolaires et périodes ─────────────────────── */
  s.onGet('/school-years').reply(() => [200, collection<AnneeScolaire>('anneesScolaires')])

  s.onGet(/^\/school-years\/[\w-]+$/).reply((config) => {
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
  s.onPatch(/^\/school-years\/[\w-]+\/open$/).reply((config) => {
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
  s.onPatch(/^\/school-years\/[\w-]+\/close$/).reply((config) => {
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

  s.onPatch(/^\/periods\/[\w-]+\/(lock|unlock)$/).reply((config) => {
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
  s.onGet(/^\/audit-logs(\?.*)?$/).reply((config) => {
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
  /* ── Centre documentaire ──────────────────────────────── */

  s.onGet('/document-templates').reply(() => [200, collection<ModeleDocument>('modelesDocuments')])

  s.onPatch(/^\/document-templates\/[\w-]+\/activate$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const modele = parId<ModeleDocument>('modelesDocuments', id)
    if (!modele) return [404, { message: 'Modèle introuvable.' }]

    // Un seul modèle actif par type : activer l'un désactive les autres.
    const modeles = collection<ModeleDocument>('modelesDocuments')
    remplacer(
      'modelesDocuments',
      modeles.map((m) => (m.type === modele.type ? { ...m, isActive: m.id === id } : m)),
    )
    return [200, { ...modele, isActive: true }]
  })

  s.onGet(/^\/documents(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const type = p.get('type')
    const statut = p.get('statut')

    let liste = [...collection<DocumentGenere>('documentsGeneres')].sort((a, b) =>
      b.generatedAt.localeCompare(a.generatedAt),
    )
    if (type) liste = liste.filter((d) => d.type === type)
    if (statut) liste = liste.filter((d) => d.status === statut)
    return [200, paginer(liste, p)]
  })

  s.onGet(/^\/documents\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const document = parId<DocumentGenere>('documentsGeneres', id)
    return document ? [200, document] : [404, { message: 'Document introuvable.' }]
  })

  s.onPost('/documents/generate').reply((config) => {
    const demande = JSON.parse(config.data ?? '{}')
    const etablissement = collection<Etablissement>('etablissements')[0]
    const modele = collection<ModeleDocument>('modelesDocuments').find(
      (m) => m.type === demande.type && m.isActive,
    )

    const annee = new Date().getFullYear()
    const prefixeType = String(demande.type ?? 'DOC')
      .slice(0, 3)
      .toUpperCase()

    // Compteur par établissement, type et année : la référence doit rester
    // unique et non réattribuable, y compris après annulation d'un document.
    const existants = collection<DocumentGenere>('documentsGeneres').filter((d) =>
      d.reference.startsWith(`${etablissement.code}-${prefixeType}-${annee}-`),
    )
    let compteur = existants.length

    const documents: DocumentGenere[] = (demande.cibles ?? []).map(
      (cible: { id: string; libelle: string }) => {
        compteur += 1
        const numero = String(compteur).padStart(5, '0')
        // Sans modèle actif pour ce type, le document ne peut pas être mis en
        // page : il est marqué en échec plutôt que produit vide.
        const statut: DocumentGenere['status'] = modele ? 'GENERATED' : 'FAILED'

        return {
          id: `doc-${nanoid(8)}`,
          establishmentId: etablissement.id,
          reference: `${etablissement.code}-${prefixeType}-${annee}-${numero}`,
          type: demande.type,
          templateId: modele?.id ?? '',
          targetType: 'STUDENT',
          targetId: cible.libelle,
          schoolYearId: demande.schoolYearId,
          periodId: demande.periodId,
          generatedBy: 'usr-1',
          generatedAt: new Date().toISOString(),
          status: statut,
        }
      },
    )

    for (const document of documents) ajouter('documentsGeneres', document)

    return [
      201,
      {
        documents,
        reussis: documents.filter((d) => d.status === 'GENERATED').length,
        echoues: documents.filter((d) => d.status === 'FAILED').length,
      },
    ]
  })

  s.onPatch(/^\/documents\/[\w-]+\/cancel$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { motif } = JSON.parse(config.data ?? '{}')
    if (String(motif ?? '').trim().length < 5) {
      return [422, { message: "Le motif d'annulation est obligatoire." }]
    }
    const maj = majParId<DocumentGenere>('documentsGeneres', id, { status: 'CANCELLED' })
    return maj ? [200, maj] : [404, { message: 'Document introuvable.' }]
  })

  // Route publique : aucune authentification, et surtout aucune donnée
  // scolaire, financière ou personnelle au-delà du nom du titulaire.
  s.onGet(/^\/public\/documents\/[\w-]+$/).reply((config) => {
    const reference = (config.url ?? '').split('/').pop() as string
    const document = collection<DocumentGenere>('documentsGeneres').find((d) => d.reference === reference)
    if (!document) return [200, { valide: false }]

    const etablissement = collection<Etablissement>('etablissements')[0]
    const annee = parId<AnneeScolaire>('anneesScolaires', document.schoolYearId)

    return [
      200,
      {
        valide: true,
        reference: document.reference,
        type: document.type,
        etablissement: etablissement.name,
        anneeScolaire: annee?.label ?? '—',
        emisLe: document.generatedAt,
        statut: document.status === 'CANCELLED' ? 'CANCELLED' : 'GENERATED',
        titulaire: document.targetId,
      },
    ]
  })

  s.onGet(/^\/notifications(\?.*)?$/).reply(() => [200, collection<Notification>('notifications')])

  /* ── Annonces ─────────────────────────────────────────── */

  /**
   * Résolution de l'audience. Sans espace parent dans cette version, les
   * destinataires sont des comptes du personnel : cibler une classe revient
   * à cibler les enseignants qui y sont affectés.
   */
  const resoudreAudience = (audienceType: string, audienceRefs: string[]): Utilisateur[] => {
    const utilisateurs = collection<Utilisateur>('utilisateurs').filter((u) => u.isActive)

    if (audienceType === 'ALL_STAFF') return utilisateurs
    if (audienceType === 'ALL_TEACHERS') return utilisateurs.filter((u) => u.role === 'TEACHER')

    if (audienceType === 'CLASS' || audienceType === 'LEVEL') {
      const classes = collection<Classe>('classes')
      const classesCiblees =
        audienceType === 'CLASS'
          ? classes.filter((c) => audienceRefs.includes(c.id))
          : classes.filter((c) => audienceRefs.includes(c.level))

      const enseignantIds = new Set(
        collection<Affectation>('affectations')
          .filter((a) => classesCiblees.some((c) => c.id === a.classId))
          .map((a) => a.teacherId),
      )
      const comptes = new Set(
        collection<Enseignant>('enseignants')
          .filter((e) => enseignantIds.has(e.id) && e.userId)
          .map((e) => e.userId as string),
      )
      return utilisateurs.filter((u) => comptes.has(u.id))
    }

    return utilisateurs.filter((u) => audienceRefs.includes(u.id))
  }

  s.onPost('/announcements/audience').reply((config) => {
    const { audienceType, audienceRefs } = JSON.parse(config.data ?? '{}')
    const destinataires = resoudreAudience(audienceType, audienceRefs ?? [])
    return [
      200,
      {
        nombre: destinataires.length,
        apercu: destinataires.slice(0, 3).map((u) => `${u.firstName} ${u.lastName}`),
      },
    ]
  })

  s.onGet(/^\/announcements(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const statut = p.get('statut')
    let liste = [...collection<Annonce>('annonces')].sort((a, b) =>
      (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''),
    )
    if (statut) liste = liste.filter((a) => a.status === statut)
    return [200, paginer(liste, p)]
  })

  /* ── Annonces reçues par le compte courant ────────────── */

  s.onGet('/announcements/received').reply((config) => {
    const moi = destinataireCourant(config)
    return [
      200,
      collection<Annonce>('annonces')
        .filter((a) => a.status === 'PUBLISHED')
        .filter((a) => resoudreAudience(a.audienceType, a.audienceRefs).some((u) => u.id === moi))
        .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')),
    ]
  })

  s.onGet(/^\/announcements\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const annonce = parId<Annonce>('annonces', id)
    return annonce ? [200, annonce] : [404, { message: 'Annonce introuvable.' }]
  })

  s.onPost('/announcements').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    if (String(corps.title ?? '').trim().length < 5) {
      return [422, { message: 'Le titre est trop court.' }]
    }
    const annonce: Annonce = {
      id: `ann-${nanoid(6)}`,
      establishmentId: 'etb-1',
      authorId: 'usr-1',
      status: 'DRAFT',
      ...corps,
    }
    ajouter('annonces', annonce)
    return [201, annonce]
  })

  s.onPatch(/^\/announcements\/[\w-]+\/publish$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const annonce = parId<Annonce>('annonces', id)
    if (!annonce) return [404, { message: 'Annonce introuvable.' }]
    if (annonce.status === 'PUBLISHED') {
      return [409, { message: 'Cette annonce a déjà été diffusée.' }]
    }

    const destinataires = resoudreAudience(annonce.audienceType, annonce.audienceRefs)
    if (destinataires.length === 0) {
      return [422, { message: "Aucun destinataire : l'annonce ne serait lue par personne." }]
    }

    // La diffusion produit une notification par destinataire. Le corps de la
    // notification reprend le titre, jamais le contenu intégral : le message
    // se lit sur l'écran des annonces.
    for (const destinataire of destinataires) {
      ajouter<Notification>('notifications', {
        id: `not-${nanoid(6)}`,
        establishmentId: 'etb-1',
        recipientUserId: destinataire.id,
        type: 'ANNONCE_PUBLIEE',
        title: annonce.title,
        body:
          annonce.priority === 'URGENT'
            ? 'Annonce urgente de la direction. Consultez-la sans tarder.'
            : 'Une nouvelle annonce a été diffusée.',
        linkRoute: '/annonces',
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }

    return [
      200,
      majParId<Annonce>('annonces', id, {
        status: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
      }),
    ]
  })

  s.onPatch(/^\/announcements\/[\w-]+\/withdraw$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { motif } = JSON.parse(config.data ?? '{}')
    if (String(motif ?? '').trim().length < 5) {
      return [422, { message: 'Le motif du retrait est obligatoire.' }]
    }
    const annonce = parId<Annonce>('annonces', id)
    if (!annonce) return [404, { message: 'Annonce introuvable.' }]
    if (annonce.status !== 'PUBLISHED') {
      return [409, { message: 'Seule une annonce diffusée peut être retirée.' }]
    }

    // Les notifications non lues de cette annonce disparaissent ; celles déjà
    // lues sont conservées, on ne réécrit pas l'historique d'un destinataire.
    const restantes = collection<Notification>('notifications').filter(
      (n) => !(n.type === 'ANNONCE_PUBLIEE' && n.title === annonce.title && !n.isRead),
    )
    remplacer('notifications', restantes)

    return [200, majParId<Annonce>('annonces', id, { status: 'WITHDRAWN' as Annonce['status'] })]
  })

  /* ── Notifications ────────────────────────────────────── */

  // Destinataire courant déduit du jeton. Côté Spring Boot, il vient du JWT
  // et n'est jamais accepté en paramètre de requête.
  const destinataireCourant = (config: { headers?: unknown }) => {
    const entetes = (config.headers ?? {}) as Record<string, string>
    const jeton = String(entetes.Authorization ?? '').replace('Bearer ', '')
    return jeton.startsWith('demo.') ? jeton.slice(5) : 'usr-1'
  }

  s.onGet(/^\/notifications(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const lues = p.get('isRead')
    const moi = destinataireCourant(config)

    let liste = collection<Notification>('notifications')
      .filter((n) => n.recipientUserId === moi)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (lues !== null && lues !== '') liste = liste.filter((n) => String(n.isRead) === lues)
    return [200, liste]
  })

  s.onGet('/notifications/unread-count').reply((config) => {
    const moi = destinataireCourant(config)
    const nombre = collection<Notification>('notifications').filter(
      (n) => n.recipientUserId === moi && !n.isRead,
    ).length
    return [200, { nombre }]
  })

  s.onPost('/notifications').reply((config) => {
    const demande = JSON.parse(config.data ?? '{}')
    for (const destinataire of demande.destinataires ?? []) {
      ajouter<Notification>('notifications', {
        id: `not-${nanoid(6)}`,
        establishmentId: 'etb-1',
        recipientUserId: destinataire,
        type: demande.type,
        title: demande.titre,
        body: demande.corps,
        linkRoute: demande.lien,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    return [201]
  })

  s.onPatch('/notifications/read-all').reply((config) => {
    const moi = destinataireCourant(config)
    remplacer(
      'notifications',
      collection<Notification>('notifications').map((n) =>
        n.recipientUserId === moi ? { ...n, isRead: true } : n,
      ),
    )
    return [204]
  })

  s.onPatch(/^\/notifications\/[\w-]+\/read$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const maj = majParId<Notification>('notifications', id, { isRead: true })
    return maj ? [200, maj] : [404, { message: 'Notification introuvable.' }]
  })

  /* ── Recherche globale ────────────────────────────────── */

  /**
   * Le filtrage par rôle est appliqué ici, côté serveur, et non dans
   * l'interface : la réponse ne doit pas contenir de résultats qu'un rôle
   * n'a pas le droit de voir, même s'ils étaient masqués à l'affichage.
   */
  const TYPES_PAR_ROLE: Record<string, string[]> = {
    PLATFORM_ADMIN: ['ELEVE', 'ENSEIGNANT', 'CLASSE', 'UTILISATEUR', 'DOCUMENT'],
    SCHOOL_ADMIN: ['ELEVE', 'ENSEIGNANT', 'CLASSE', 'UTILISATEUR', 'DOCUMENT'],
    ADMIN: ['ELEVE', 'ENSEIGNANT', 'CLASSE', 'UTILISATEUR', 'DOCUMENT'],
    SECRETARY: ['ELEVE', 'ENSEIGNANT', 'CLASSE', 'DOCUMENT'],
    ACADEMIC_HEAD: ['ELEVE', 'ENSEIGNANT', 'CLASSE', 'DOCUMENT'],
    ACCOUNTANT: ['ELEVE', 'CLASSE', 'DOCUMENT'],
    TEACHER: ['ELEVE', 'CLASSE'],
  }

  s.onGet(/^\/search(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const terme = (p.get('q') ?? '').trim().toLowerCase()
    if (terme.length < 2) return [200, { resultats: [], total: 0, typesAutorises: [] }]

    const moi = collection<Utilisateur>('utilisateurs').find((u) => u.id === destinataireCourant(config))
    const typesAutorises = TYPES_PAR_ROLE[moi?.role ?? 'TEACHER'] ?? []

    const demandes = (p.get('types') ?? '').split(',').filter(Boolean)
    const retenus = demandes.length ? typesAutorises.filter((t) => demandes.includes(t)) : typesAutorises

    const contient = (...champs: (string | undefined)[]) =>
      champs.some((c) => (c ?? '').toLowerCase().includes(terme))

    const resultats: {
      type: string
      id: string
      titre: string
      precision?: string
      route: string
    }[] = []

    if (retenus.includes('ELEVE')) {
      const classes = collection<Classe>('classes')
      const inscriptions = collection<Inscription>('inscriptions')
      for (const eleve of collection<Eleve>('eleves')) {
        if (!contient(eleve.firstName, eleve.lastName, eleve.matricule)) continue
        const inscription = inscriptions.find((i) => i.studentId === eleve.id && i.status === 'ACTIVE')
        const classe = classes.find((c) => c.id === inscription?.classId)
        resultats.push({
          type: 'ELEVE',
          id: eleve.id,
          titre: `${eleve.lastName.toUpperCase()} ${eleve.firstName}`,
          // Matricule et classe suffisent à identifier : ni contact, ni
          // situation financière, ni résultat scolaire dans un résultat.
          precision: [eleve.matricule, classe?.name].filter(Boolean).join(' · '),
          route: `/eleves/${eleve.id}`,
        })
      }
    }

    if (retenus.includes('ENSEIGNANT')) {
      for (const enseignant of collection<Enseignant>('enseignants')) {
        if (!contient(enseignant.firstName, enseignant.lastName)) continue
        resultats.push({
          type: 'ENSEIGNANT',
          id: enseignant.id,
          titre: `${enseignant.lastName.toUpperCase()} ${enseignant.firstName}`,
          precision: enseignant.isActive ? undefined : 'Compte désactivé',
          route: `/enseignants/${enseignant.id}`,
        })
      }
    }

    if (retenus.includes('CLASSE')) {
      for (const classe of collection<Classe>('classes')) {
        if (!contient(classe.name, classe.level, classe.series)) continue
        resultats.push({
          type: 'CLASSE',
          id: classe.id,
          titre: classe.name,
          precision: `${classe.studentCount} élève(s)`,
          route: `/classes/${classe.id}`,
        })
      }
    }

    if (retenus.includes('UTILISATEUR')) {
      for (const utilisateur of collection<Utilisateur>('utilisateurs')) {
        if (!contient(utilisateur.firstName, utilisateur.lastName, utilisateur.email)) continue
        resultats.push({
          type: 'UTILISATEUR',
          id: utilisateur.id,
          titre: `${utilisateur.lastName.toUpperCase()} ${utilisateur.firstName}`,
          precision: utilisateur.isActive ? utilisateur.email : 'Compte désactivé',
          route: `/utilisateurs/${utilisateur.id}`,
        })
      }
    }

    if (retenus.includes('DOCUMENT')) {
      for (const document of collection<DocumentGenere>('documentsGeneres')) {
        if (!contient(document.reference, document.targetId)) continue
        resultats.push({
          type: 'DOCUMENT',
          id: document.id,
          titre: document.reference,
          precision: document.status === 'CANCELLED' ? 'Annulé' : document.targetId,
          route: `/documents/${document.id}/apercu`,
        })
      }
    }

    // Plafond : au-delà, l'utilisateur doit préciser sa recherche plutôt que
    // de faire remonter des milliers de lignes.
    const plafonnes = resultats.slice(0, 50)
    return [200, { resultats: plafonnes, total: plafonnes.length, typesAutorises }]
  })

  /* ── Rôles, permissions, fiche utilisateur ────────────── */

  s.onPatch(/^\/users\/[\w-]+\/role$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { role } = JSON.parse(config.data ?? '{}')
    const maj = majParId<Utilisateur>('utilisateurs', id, { role })
    return maj ? [200, maj] : [404, { message: 'Utilisateur introuvable.' }]
  })

  s.onPut(/^\/users\/[\w-]+\/permissions$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { permissions } = JSON.parse(config.data ?? '{}')
    const maj = majParId<Utilisateur>('utilisateurs', id, { permissions })
    return maj ? [200, maj] : [404, { message: 'Utilisateur introuvable.' }]
  })

  s.onGet('/roles/permissions').reply(() => [200, collection<unknown>('matriceRoles')[0]])

  s.onPut('/roles/permissions').reply((config) => {
    const matrice = JSON.parse(config.data ?? '{}')
    // Le Super Administrateur n'est pas éditable : sa ligne est ignorée même
    // si le client l'envoie.
    delete matrice.SCHOOL_ADMIN
    remplacer('matriceRoles', [matrice])
    return [200, matrice]
  })
}
