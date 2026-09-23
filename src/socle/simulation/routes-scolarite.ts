/**
 * Routes simulees du lot B · PROPRIETAIRE : Alida
 *
 * Modèle a suivre : voir routes-administration.ts, notamment la gestion des
 * filtres, de la pagination et des codes d'erreur.
 */
import type MockAdapter from 'axios-mock-adapter'
import { nanoid } from 'nanoid'
import type { AnneeScolaire, Etablissement } from '../modeles/administration'
import type {
  Affectation,
  Classe,
  CreneauEmploiDuTemps,
  Eleve,
  Enseignant,
  Inscription,
  Matiere,
  Salle,
} from '../modeles/scolarite'
import type { Exoneration, Frais, Paiement, Recu } from '../modeles/finances'
import {
  calculerSituationFinanciere as calculerSituation,
  fraisApplicables as calculerFraisApplicables,
} from '../../modules/finances/calculs'
import {
  detecterConflits as detecterConflitsCreneau,
  LIBELLE_JOUR,
  LIBELLE_RAISON_CONFLIT as LIBELLE_RAISON,
} from '../../modules/emploi-du-temps/calculs'
import { genererEmploiDuTempsAleatoire } from '../../modules/emploi-du-temps/generation'
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

export function routesScolarite(s: MockAdapter) {
  /* ── Élèves ───────────────────────────────────────────── */

  s.onGet(/^\/students(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const recherche = (p.get('recherche') ?? '').toLowerCase()
    const classId = p.get('classId')
    const status = p.get('status')

    let liste = collection<Eleve>('eleves')

    if (recherche) {
      liste = liste.filter((e) =>
        `${e.firstName} ${e.lastName} ${e.matricule}`.toLowerCase().includes(recherche),
      )
    }
    if (status) liste = liste.filter((e) => e.status === status)
    if (classId) {
      const inscritsDeLaClasse = new Set(
        collection<Inscription>('inscriptions')
          .filter((i) => i.classId === classId && i.status === 'ACTIVE')
          .map((i) => i.studentId),
      )
      liste = liste.filter((e) => inscritsDeLaClasse.has(e.id))
    }

    return [200, paginer(liste, p)]
  })

  s.onGet(/^\/students\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const eleve = parId<Eleve>('eleves', id)
    return eleve ? [200, eleve] : [404, { message: 'Élève introuvable.' }]
  })

  s.onPost('/students').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    const etablissement = etablissementCourantDonnees<Etablissement>()
    const classe = parId<Classe>('classes', corps.classId)
    if (!classe) return [422, { message: 'La classe indiquée est introuvable.' }]

    // RG-03 : matricule généré par le serveur, jamais saisi. Le compteur
    // repart à 0001 à chaque année scolaire (deux derniers chiffres de
    // l'année dans le préfixe du matricule).
    const annee = String(new Date().getFullYear()).slice(-2)
    const prefixe = `${etablissement.code}-${annee}-`
    const existants = collection<Eleve>('eleves').filter((e) => e.matricule.startsWith(prefixe))
    const numero = String(existants.length + 1).padStart(4, '0')

    const eleve: Eleve = {
      id: `elv-${nanoid(8)}`,
      establishmentId: etablissement.id,
      matricule: `${prefixe}${numero}`,
      firstName: corps.firstName,
      lastName: corps.lastName,
      birthDate: corps.birthDate,
      birthPlace: corps.birthPlace,
      gender: corps.gender,
      phone: corps.phone || undefined,
      address: corps.address || undefined,
      guardianName: corps.guardianName,
      guardianPhone: corps.guardianPhone,
      guardianRelationship: corps.guardianRelationship,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    }
    ajouter('eleves', eleve)

    // Un élève créé sans inscription active n'a pas de sens dans
    // l'application : les deux se créent dans le même geste.
    const inscription: Inscription = {
      id: `ins-${nanoid(8)}`,
      establishmentId: etablissement.id,
      studentId: eleve.id,
      classId: corps.classId,
      schoolYearId: classe.schoolYearId,
      enrolledAt: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE',
      isRenewal: false,
    }
    ajouter('inscriptions', inscription)
    majParId<Classe>('classes', classe.id, { studentCount: classe.studentCount + 1 })

    return [201, eleve]
  })

  s.onPut(/^\/students\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const corps = JSON.parse(config.data ?? '{}')
    // Le matricule, le nom et la date de naissance ne se modifient jamais
    // par ce formulaire : seules les coordonnées de contact et du tuteur
    // sont éditables au fil de la scolarité.
    const maj = majParId<Eleve>('eleves', id, {
      phone: corps.phone || undefined,
      address: corps.address || undefined,
      guardianName: corps.guardianName,
      guardianPhone: corps.guardianPhone,
      guardianRelationship: corps.guardianRelationship,
    })
    return maj ? [200, maj] : [404, { message: 'Élève introuvable.' }]
  })

  s.onPatch(/^\/students\/[\w-]+\/archive$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { motif } = JSON.parse(config.data ?? '{}')
    if (String(motif ?? '').trim().length < 5) {
      return [422, { message: "Le motif d'archivage est obligatoire." }]
    }
    const eleve = parId<Eleve>('eleves', id)
    if (!eleve) return [404, { message: 'Élève introuvable.' }]

    // L'archivage ne supprime rien : le dossier et son historique restent
    // consultables, seule l'inscription active se referme.
    const inscriptionActive = collection<Inscription>('inscriptions').find(
      (i) => i.studentId === id && i.status === 'ACTIVE',
    )
    if (inscriptionActive) {
      majParId<Inscription>('inscriptions', inscriptionActive.id, { status: 'DROPPED' })
    }

    return [200, majParId<Eleve>('eleves', id, { status: 'ARCHIVED' })]
  })

  /* ── Classes ──────────────────────────────────────────── */

  s.onGet(/^\/classes(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const level = p.get('level')
    const schoolYearId = p.get('schoolYearId')

    let liste = collection<Classe>('classes')
    if (level) liste = liste.filter((c) => c.level === level)
    if (schoolYearId) liste = liste.filter((c) => c.schoolYearId === schoolYearId)

    return [200, liste]
  })

  s.onGet(/^\/classes\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const classe = parId<Classe>('classes', id)
    return classe ? [200, classe] : [404, { message: 'Classe introuvable.' }]
  })

  s.onPost('/classes').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    const etablissement = etablissementCourantDonnees<Etablissement>()
    const anneeOuverte = collection<AnneeScolaire>('anneesScolaires').find((a) => a.status === 'OPEN')
    if (!anneeOuverte) {
      return [409, { message: 'Aucune année scolaire ouverte : impossible de créer une classe.' }]
    }

    const classe: Classe = {
      id: `cls-${nanoid(8)}`,
      establishmentId: etablissement.id,
      schoolYearId: anneeOuverte.id,
      name: corps.name,
      level: corps.level,
      series: corps.series || undefined,
      capacity: Number(corps.capacity),
      roomId: corps.roomId || undefined,
      studentCount: 0,
    }
    ajouter('classes', classe)
    return [201, classe]
  })

  s.onPut(/^\/classes\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const corps = JSON.parse(config.data ?? '{}')
    const classe = parId<Classe>('classes', id)
    if (!classe) return [404, { message: 'Classe introuvable.' }]

    const capacite = Number(corps.capacity)
    if (capacite < classe.studentCount) {
      return [
        422,
        {
          message: `La capacité ne peut pas descendre sous l'effectif actuel (${classe.studentCount}).`,
        },
      ]
    }

    return [
      200,
      majParId<Classe>('classes', id, {
        capacity: capacite,
        roomId: corps.roomId || undefined,
        headTeacherId: corps.headTeacherId || undefined,
      }),
    ]
  })
  /* ── Matières, salles, enseignants ────────────────────── */
  s.onGet(/^\/subjects(\?.*)?$/).reply(() => [200, collection<Matiere>('matieres')])

  s.onPost('/subjects').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    const etablissement = etablissementCourantDonnees<Etablissement>()

    const doublon = collection<Matiere>('matieres').some(
      (m) => m.code.toLowerCase() === String(corps.code ?? '').toLowerCase(),
    )
    if (doublon) return [409, { message: `Le code « ${corps.code} » est déjà utilisé.` }]

    const matiere: Matiere = {
      id: `mat-${nanoid(8)}`,
      establishmentId: etablissement.id,
      name: corps.name,
      code: String(corps.code).toUpperCase(),
      coefficient: Number(corps.coefficient),
      maxGrade: Number(corps.maxGrade),
      isActive: true,
    }
    ajouter('matieres', matiere)
    return [201, matiere]
  })

  s.onPut(/^\/subjects\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const corps = JSON.parse(config.data ?? '{}')
    const maj = majParId<Matiere>('matieres', id, {
      name: corps.name,
      coefficient: Number(corps.coefficient),
      maxGrade: Number(corps.maxGrade),
    })
    return maj ? [200, maj] : [404, { message: 'Matière introuvable.' }]
  })

  s.onPatch(/^\/subjects\/[\w-]+\/status$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { isActive } = JSON.parse(config.data ?? '{}')
    const maj = majParId<Matiere>('matieres', id, { isActive })
    return maj ? [200, maj] : [404, { message: 'Matière introuvable.' }]
  })
  s.onGet(/^\/rooms(\?.*)?$/).reply(() => [200, collection<Salle>('salles')])

  s.onPost('/rooms').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    const etablissement = etablissementCourantDonnees<Etablissement>()

    const doublon = collection<Salle>('salles').some(
      (s) => s.name.toLowerCase() === String(corps.name ?? '').toLowerCase(),
    )
    if (doublon) return [409, { message: `Une salle nommée « ${corps.name} » existe déjà.` }]

    const salle: Salle = {
      id: `sal-${nanoid(8)}`,
      establishmentId: etablissement.id,
      name: corps.name,
      capacity: Number(corps.capacity),
      type: corps.type,
      isAvailable: true,
    }
    ajouter('salles', salle)
    return [201, salle]
  })

  s.onPut(/^\/rooms\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const corps = JSON.parse(config.data ?? '{}')
    const maj = majParId<Salle>('salles', id, { capacity: Number(corps.capacity), type: corps.type })
    return maj ? [200, maj] : [404, { message: 'Salle introuvable.' }]
  })

  s.onPatch(/^\/rooms\/[\w-]+\/availability$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { isAvailable } = JSON.parse(config.data ?? '{}')
    const salle = majParId<Salle>('salles', id, { isAvailable })
    if (!salle) return [404, { message: 'Salle introuvable.' }]

    // Avertissement non bloquant : aucune classe n'est réaffectée
    // automatiquement, faute d'emploi du temps pour arbitrer un remplacement.
    const classesConcernees = isAvailable
      ? []
      : collection<Classe>('classes')
          .filter((c) => c.roomId === id)
          .map((c) => c.name)

    return [200, { salle, classesConcernees }]
  })

  s.onGet(/^\/teachers(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const recherche = (p.get('recherche') ?? '').toLowerCase()
    const subjectId = p.get('subjectId')
    const actif = p.get('actif')

    let liste = collection<Enseignant>('enseignants')
    if (recherche) {
      liste = liste.filter((e) => `${e.firstName} ${e.lastName}`.toLowerCase().includes(recherche))
    }
    if (subjectId) liste = liste.filter((e) => e.subjectIds.includes(subjectId))
    if (actif !== null && actif !== '') liste = liste.filter((e) => String(e.isActive) === actif)

    return [200, liste]
  })

  s.onGet(/^\/teachers\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const enseignant = parId<Enseignant>('enseignants', id)
    return enseignant ? [200, enseignant] : [404, { message: 'Enseignant introuvable.' }]
  })

  s.onPost('/teachers').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    const etablissement = etablissementCourantDonnees<Etablissement>()
    const enseignant: Enseignant = {
      id: `ens-${nanoid(8)}`,
      establishmentId: etablissement.id,
      firstName: corps.firstName,
      lastName: corps.lastName,
      phone: corps.phone,
      email: corps.email || undefined,
      subjectIds: corps.subjectIds ?? [],
      hireDate: corps.hireDate || undefined,
      isActive: true,
    }
    ajouter('enseignants', enseignant)
    return [201, enseignant]
  })

  s.onPut(/^\/teachers\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const corps = JSON.parse(config.data ?? '{}')
    const maj = majParId<Enseignant>('enseignants', id, {
      phone: corps.phone,
      email: corps.email || undefined,
      subjectIds: corps.subjectIds ?? [],
    })
    return maj ? [200, maj] : [404, { message: 'Enseignant introuvable.' }]
  })

  s.onPatch(/^\/teachers\/[\w-]+\/status$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { isActive } = JSON.parse(config.data ?? '{}')
    const maj = majParId<Enseignant>('enseignants', id, { isActive })
    return maj ? [200, maj] : [404, { message: 'Enseignant introuvable.' }]
  })

  /* ── Inscriptions ─────────────────────────────────────── */
  s.onGet(/^\/enrollments(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const classId = p.get('classId')
    const studentId = p.get('studentId')
    const status = p.get('status')
    // Par défaut seules les inscriptions actives sont renvoyées ; le
    // dossier élève et le registre doivent pouvoir consulter tout
    // l'historique, y compris les inscriptions closes.
    const toutStatut = p.get('tout') === 'true'

    let liste = toutStatut
      ? collection<Inscription>('inscriptions')
      : collection<Inscription>('inscriptions').filter((i) => i.status === 'ACTIVE')

    if (classId) liste = liste.filter((i) => i.classId === classId)
    if (studentId) liste = liste.filter((i) => i.studentId === studentId)
    if (status) liste = liste.filter((i) => i.status === status)

    return [200, liste]
  })

  s.onPost('/enrollments/renew').reply((config) => {
    const { studentId, classId } = JSON.parse(config.data ?? '{}')
    const classe = parId<Classe>('classes', classId)
    if (!classe) return [422, { message: 'La classe indiquée est introuvable.' }]

    // RG-04 : au plus une inscription active par élève et par année scolaire.
    const dejaActive = collection<Inscription>('inscriptions').some(
      (i) => i.studentId === studentId && i.schoolYearId === classe.schoolYearId && i.status === 'ACTIVE',
    )
    if (dejaActive) {
      return [409, { message: 'Cet élève a déjà une inscription active sur cette année scolaire.' }]
    }

    const etablissement = etablissementCourantDonnees<Etablissement>()
    const inscription: Inscription = {
      id: `ins-${nanoid(8)}`,
      establishmentId: etablissement.id,
      studentId,
      classId,
      schoolYearId: classe.schoolYearId,
      enrolledAt: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE',
      isRenewal: true,
    }
    ajouter('inscriptions', inscription)
    majParId<Classe>('classes', classe.id, { studentCount: classe.studentCount + 1 })

    return [201, inscription]
  })

  s.onPatch(/^\/enrollments\/[\w-]+\/transfer-class$/).reply((config) => {
    const id = (config.url ?? '').split('/')[2]
    const { classIdCible } = JSON.parse(config.data ?? '{}')

    const inscription = parId<Inscription>('inscriptions', id)
    if (!inscription) return [404, { message: 'Inscription introuvable.' }]
    if (inscription.status !== 'ACTIVE') {
      return [409, { message: 'Seule une inscription active peut être transférée.' }]
    }

    const classeCible = parId<Classe>('classes', classIdCible)
    if (!classeCible) return [422, { message: 'La classe de destination est introuvable.' }]
    if (classeCible.schoolYearId !== inscription.schoolYearId) {
      return [422, { message: "Le transfert ne peut se faire qu'au sein de la même année scolaire." }]
    }

    const classeSource = parId<Classe>('classes', inscription.classId)
    if (classeSource) {
      majParId<Classe>('classes', classeSource.id, {
        studentCount: Math.max(0, classeSource.studentCount - 1),
      })
    }
    majParId<Classe>('classes', classeCible.id, { studentCount: classeCible.studentCount + 1 })

    return [200, majParId<Inscription>('inscriptions', id, { classId: classIdCible })]
  })

  /* ── Affectations ──────────────────────────────────────── */

  s.onGet(/^\/assignments(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const classId = p.get('classId')
    const teacherId = p.get('teacherId')
    const subjectId = p.get('subjectId')

    let liste = collection<Affectation>('affectations')
    if (classId) liste = liste.filter((a) => a.classId === classId)
    if (teacherId) liste = liste.filter((a) => a.teacherId === teacherId)
    if (subjectId) liste = liste.filter((a) => a.subjectId === subjectId)

    return [200, liste]
  })

  s.onPost('/assignments').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    const etablissement = etablissementCourantDonnees<Etablissement>()
    const classe = parId<Classe>('classes', corps.classId)
    if (!classe) return [422, { message: 'La classe indiquée est introuvable.' }]

    const doublon = collection<Affectation>('affectations').some(
      (a) =>
        a.teacherId === corps.teacherId &&
        a.subjectId === corps.subjectId &&
        a.classId === corps.classId &&
        a.schoolYearId === classe.schoolYearId,
    )
    if (doublon) {
      return [409, { message: 'Cette affectation existe déjà pour cette année scolaire.' }]
    }

    const affectation: Affectation = {
      id: `aff-${nanoid(8)}`,
      establishmentId: etablissement.id,
      schoolYearId: classe.schoolYearId,
      teacherId: corps.teacherId,
      subjectId: corps.subjectId,
      classId: corps.classId,
    }
    ajouter('affectations', affectation)
    return [201, affectation]
  })

  s.onDelete(/^\/assignments\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const existe = parId<Affectation>('affectations', id)
    if (!existe) return [404, { message: 'Affectation introuvable.' }]

    // Suppression réelle, contrairement aux autres entités du projet : une
    // affectation ne porte aucune donnée à préserver pour l'audit, voir la
    // note en tête de modules/affectations/api.ts.
    remplacer(
      'affectations',
      collection<Affectation>('affectations').filter((a) => a.id !== id),
    )
    return [204]
  })

  /* ── Finance ───────────────────────────────────────────── */

  s.onGet(/^\/finance\/fees(\?.*)?$/).reply(() => [200, collection<Frais>('frais')])

  s.onPost('/finance/fees').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    const etablissement = etablissementCourantDonnees<Etablissement>()
    const anneeOuverte = collection<AnneeScolaire>('anneesScolaires').find((a) => a.status === 'OPEN')
    if (!anneeOuverte) {
      return [409, { message: 'Aucune année scolaire ouverte : impossible de créer un frais.' }]
    }
    if (corps.scope !== 'ALL' && !corps.scopeRef) {
      return [422, { message: 'Précisez le niveau ou la classe concerné par ce frais.' }]
    }

    const id = `fr-${nanoid(8)}`
    const tranches = (corps.installments ?? []).map(
      (t: { label: string; amount: number; dueDate: string }, i: number) => ({
        id: `${id}-t${i + 1}`,
        feeItemId: id,
        label: t.label,
        amount: Number(t.amount),
        dueDate: t.dueDate,
      }),
    )
    if (tranches.length === 0) {
      return [422, { message: 'Un frais doit comporter au moins une tranche.' }]
    }

    const frais: Frais = {
      id,
      establishmentId: etablissement.id,
      schoolYearId: anneeOuverte.id,
      label: corps.label,
      scope: corps.scope,
      scopeRef: corps.scope === 'ALL' ? undefined : corps.scopeRef,
      // Le montant total n'est jamais accepté du client : il est recalculé
      // depuis la somme des tranches, comme le matricule d'un élève n'est
      // jamais saisi. Sans cette règle, un appel qui enverrait un montant
      // incohérent avec son échéancier corromprait silencieusement le
      // calcul de la situation financière (due = somme des frais.amount).
      amount: tranches.reduce((s: number, t: { amount: number }) => s + t.amount, 0),
      isMandatory: Boolean(corps.isMandatory),
      installments: tranches,
    }
    ajouter('frais', frais)
    return [201, frais]
  })

  s.onGet(/^\/finance\/exemptions(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const studentId = p.get('studentId')
    let liste = collection<Exoneration>('exonerations')
    if (studentId) liste = liste.filter((e) => e.studentId === studentId)
    return [200, liste]
  })

  s.onPost('/finance/exemptions').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    const etablissement = etablissementCourantDonnees<Etablissement>()
    const anneeOuverte = collection<AnneeScolaire>('anneesScolaires').find((a) => a.status === 'OPEN')
    if (!anneeOuverte) return [409, { message: 'Aucune année scolaire ouverte.' }]

    const exoneration: Exoneration = {
      id: `exo-${nanoid(8)}`,
      establishmentId: etablissement.id,
      studentId: corps.studentId,
      schoolYearId: anneeOuverte.id,
      feeItemId: corps.feeItemId || undefined,
      reason: corps.reason,
      grantedBy: 'usr-1',
      grantedAt: new Date().toISOString().slice(0, 10),
    }
    ajouter('exonerations', exoneration)
    return [201, exoneration]
  })

  s.onGet(/^\/finance\/payments(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const studentId = p.get('studentId')
    const status = p.get('status')
    const classId = p.get('classId')

    let liste = [...collection<Paiement>('paiements')].sort((a, b) => b.paidAt.localeCompare(a.paidAt))
    if (studentId) liste = liste.filter((pay) => pay.studentId === studentId)
    if (status) liste = liste.filter((pay) => pay.status === status)
    if (classId) {
      const inscritsDeLaClasse = new Set(
        collection<Inscription>('inscriptions')
          .filter((i) => i.classId === classId && i.status === 'ACTIVE')
          .map((i) => i.studentId),
      )
      liste = liste.filter((pay) => inscritsDeLaClasse.has(pay.studentId))
    }

    return [200, liste]
  })

  s.onPost('/finance/payments').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    const etablissement = etablissementCourantDonnees<Etablissement>()
    const frais = parId<Frais>('frais', corps.feeItemId)
    if (!frais) return [422, { message: 'Le frais indiqué est introuvable.' }]
    if (!(Number(corps.amount) > 0)) {
      return [422, { message: 'Le montant doit être supérieur à zéro.' }]
    }

    const compteur = collection<Paiement>('paiements').length + 1
    const paiement: Paiement = {
      id: `pay-${nanoid(8)}`,
      establishmentId: etablissement.id,
      reference: `${etablissement.code}-PAY-${String(compteur).padStart(5, '0')}`,
      studentId: corps.studentId,
      enrollmentId: corps.enrollmentId,
      feeItemId: corps.feeItemId,
      installmentId: corps.installmentId || undefined,
      amount: Number(corps.amount),
      method: corps.method,
      externalRef: corps.externalRef || undefined,
      paidAt: new Date().toISOString(),
      recordedBy: 'usr-4',
      status: 'VALID',
    }
    ajouter('paiements', paiement)

    // RG : tout paiement enregistré produit un reçu, dans le même geste.
    const compteurRecu = collection<Recu>('recus').length + 1
    const recu: Recu = {
      id: `rec-${nanoid(8)}`,
      establishmentId: etablissement.id,
      number: `${etablissement.code}-REC-${String(compteurRecu).padStart(5, '0')}`,
      paymentId: paiement.id,
      studentId: paiement.studentId,
      amount: paiement.amount,
      issuedAt: paiement.paidAt,
      issuedBy: paiement.recordedBy,
      status: 'VALID',
    }
    ajouter('recus', recu)

    return [201, { paiement, recu }]
  })

  s.onPatch(/^\/finance\/payments\/[\w-]+\/cancel$/).reply((config) => {
    const id = (config.url ?? '').split('/')[3]
    const { motif } = JSON.parse(config.data ?? '{}')
    if (String(motif ?? '').trim().length < 5) {
      return [422, { message: "Le motif d'annulation est obligatoire." }]
    }
    const paiement = parId<Paiement>('paiements', id)
    if (!paiement) return [404, { message: 'Paiement introuvable.' }]
    if (paiement.status === 'CANCELLED') {
      return [409, { message: 'Ce paiement est déjà annulé.' }]
    }

    // Le reçu associé est invalidé dans le même geste : il ne doit jamais
    // rester valide alors que le paiement qu'il atteste ne l'est plus.
    const recuAssocie = collection<Recu>('recus').find((r) => r.paymentId === id)
    if (recuAssocie) majParId<Recu>('recus', recuAssocie.id, { status: 'CANCELLED' })

    return [200, majParId<Paiement>('paiements', id, { status: 'CANCELLED', cancelReason: motif })]
  })

  /* ── Situation financière ──────────────────────────────── */

  function situationDUnEleve(studentId: string, aujourdHui: Date) {
    const eleve = parId<Eleve>('eleves', studentId)
    if (!eleve) return null

    const inscription = collection<Inscription>('inscriptions').find(
      (i) => i.studentId === studentId && i.status === 'ACTIVE',
    )
    const classe = inscription ? parId<Classe>('classes', inscription.classId) : undefined

    const applicables = classe
      ? calculerFraisApplicables(collection<Frais>('frais'), { classId: classe.id, level: classe.level })
      : []

    const resultat = calculerSituation({
      fraisDuStudent: applicables,
      exonerations: collection<Exoneration>('exonerations'),
      paiements: collection<Paiement>('paiements'),
      studentId,
      schoolYearId: classe?.schoolYearId ?? '',
      aujourdHui,
    })

    // Le moteur pur ne connaît pas l'année scolaire (elle ne sert à rien à
    // son calcul) : on la rattache ici, où le contexte existe.
    return { eleve, schoolYearId: classe?.schoolYearId ?? '', ...resultat }
  }

  s.onGet(/^\/finance\/situation\/[\w-]+$/).reply((config) => {
    const studentId = (config.url ?? '').split('/').pop() as string
    const resultat = situationDUnEleve(studentId, new Date())
    if (!resultat) return [404, { message: 'Élève introuvable.' }]
    const { schoolYearId, due, paid, balance, status, isOverdue, nextDueDate } = resultat
    return [200, { studentId, schoolYearId, due, paid, balance, status, isOverdue, nextDueDate }]
  })

  s.onGet(/^\/finance\/situation(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const classId = p.get('classId')
    if (!classId) return [200, []]

    const inscriptions = collection<Inscription>('inscriptions').filter(
      (i) => i.classId === classId && i.status === 'ACTIVE',
    )

    const lignes = inscriptions
      .map((inscription) => {
        const resultat = situationDUnEleve(inscription.studentId, new Date())
        if (!resultat) return null
        const { eleve, ...situation } = resultat
        return {
          studentId: inscription.studentId,
          matricule: eleve.matricule,
          fullName: `${eleve.lastName.toUpperCase()} ${eleve.firstName}`,
          ...situation,
        }
      })
      .filter((l): l is NonNullable<typeof l> => l !== null)

    return [200, lignes]
  })

  /* ── Emploi du temps ───────────────────────────────────── */

  s.onGet(/^\/timetable(\?.*)?$/).reply((config) => {
    const p = parametres(config)
    const classId = p.get('classId')
    const teacherId = p.get('teacherId')
    const roomId = p.get('roomId')

    let liste = collection<CreneauEmploiDuTemps>('emploiDuTemps')
    if (classId) liste = liste.filter((c) => c.classId === classId)
    if (teacherId) liste = liste.filter((c) => c.teacherId === teacherId)
    if (roomId) liste = liste.filter((c) => c.roomId === roomId)

    return [200, liste]
  })

  s.onPost('/timetable').reply((config) => {
    const corps = JSON.parse(config.data ?? '{}')
    const etablissement = etablissementCourantDonnees<Etablissement>()
    const anneeOuverte = collection<AnneeScolaire>('anneesScolaires').find((a) => a.status === 'OPEN')
    if (!anneeOuverte) {
      return [409, { message: 'Aucune année scolaire ouverte : impossible de créer un créneau.' }]
    }

    const nouveau = {
      dayOfWeek: Number(corps.dayOfWeek),
      startTime: corps.startTime,
      endTime: corps.endTime,
      teacherId: corps.teacherId,
      roomId: corps.roomId,
      classId: corps.classId,
    }

    // Un conflit d'emploi du temps est un impossible physique : la création
    // est bloquée, contrairement à l'avertissement non bloquant du Planning
    // des évaluations. Le détail des raisons est rédigé ici, en clair,
    // parce que l'intercepteur global ne transmet qu'un message texte au
    // client (voir la note dans modules/emploi-du-temps/api.ts).
    const existants = collection<CreneauEmploiDuTemps>('emploiDuTemps').filter(
      (c) => c.schoolYearId === anneeOuverte.id,
    )
    const conflits = detecterConflitsCreneau(nouveau, existants)

    if (conflits.length > 0) {
      const enseignants = collection<Enseignant>('enseignants')
      const salles = collection<Salle>('salles')
      const classes = collection<Classe>('classes')
      const detail = conflits
        .map((conflit) => {
          const raisons = conflit.raisons.map((raison) => LIBELLE_RAISON[raison]).join(', ')
          const enseignant = enseignants.find((e) => e.id === conflit.creneau.teacherId)
          const salle = salles.find((r) => r.id === conflit.creneau.roomId)
          const classe = classes.find((c) => c.id === conflit.creneau.classId)
          return `${raisons} (${LIBELLE_JOUR[conflit.creneau.dayOfWeek]} ${conflit.creneau.startTime}–${conflit.creneau.endTime}, ${classe?.name ?? ''} avec ${enseignant ? `${enseignant.firstName} ${enseignant.lastName}` : ''} en ${salle?.name ?? ''})`
        })
        .join(' · ')
      return [409, { message: `Conflit d'emploi du temps : ${detail}.` }]
    }

    const creneau: CreneauEmploiDuTemps = {
      id: `emp-${nanoid(8)}`,
      establishmentId: etablissement.id,
      schoolYearId: anneeOuverte.id,
      ...nouveau,
      subjectId: corps.subjectId,
    }
    ajouter('emploiDuTemps', creneau)
    return [201, creneau]
  })

  s.onDelete(/^\/timetable\/[\w-]+$/).reply((config) => {
    const id = (config.url ?? '').split('/').pop() as string
    const existe = parId<CreneauEmploiDuTemps>('emploiDuTemps', id)
    if (!existe) return [404, { message: 'Créneau introuvable.' }]
    remplacer(
      'emploiDuTemps',
      collection<CreneauEmploiDuTemps>('emploiDuTemps').filter((c) => c.id !== id),
    )
    return [204]
  })

  /**
   * Génération automatique pour tout l'établissement : un créneau par
   * couple (classe, matière, enseignant) des affectations de l'année
   * ouverte, sans toucher aux créneaux déjà posés manuellement. Le rapport
   * détaille les échecs avec des noms lisibles, pas des identifiants bruts
   * — c'est ce qu'un responsable regarde pour savoir quoi ajuster à la main.
   */
  s.onPost('/timetable/generate').reply(() => {
    const etablissement = etablissementCourantDonnees<Etablissement>()
    const anneeOuverte = collection<AnneeScolaire>('anneesScolaires').find((a) => a.status === 'OPEN')
    if (!anneeOuverte) {
      return [409, { message: 'Aucune année scolaire ouverte : impossible de générer un emploi du temps.' }]
    }

    const salles = collection<Salle>('salles')
    const existants = collection<CreneauEmploiDuTemps>('emploiDuTemps').filter(
      (c) => c.schoolYearId === anneeOuverte.id,
    )

    // Relancer la génération doit combler les manques, pas dupliquer ce qui
    // est déjà posé : un couple (classe, matière, enseignant) qui a déjà au
    // moins un créneau n'est pas une « affectation sans emploi du temps ».
    const dejaPlace = new Set(existants.map((c) => `${c.classId}:${c.subjectId}:${c.teacherId}`))
    const affectationsRestantes = collection<Affectation>('affectations')
      .filter((a) => a.schoolYearId === anneeOuverte.id)
      .filter((a) => !dejaPlace.has(`${a.classId}:${a.subjectId}:${a.teacherId}`))
      .map((a) => ({ classId: a.classId, subjectId: a.subjectId, teacherId: a.teacherId }))

    let compteur = 0
    const resultat = genererEmploiDuTempsAleatoire(
      affectationsRestantes,
      salles,
      existants,
      () => `emp-${nanoid(8)}-${compteur++}`,
      { establishmentId: etablissement.id, schoolYearId: anneeOuverte.id },
    )

    for (const creneau of resultat.crees) ajouter('emploiDuTemps', creneau)

    const classes = collection<Classe>('classes')
    const matieres = collection<Matiere>('matieres')
    const enseignants = collection<Enseignant>('enseignants')
    const nomEnseignant = (id: string) => {
      const e = enseignants.find((x) => x.id === id)
      return e ? `${e.firstName} ${e.lastName}` : id
    }

    return [
      200,
      {
        crees: resultat.crees.length,
        total: affectationsRestantes.length,
        echecs: resultat.echecs.map((e) => ({
          classe: classes.find((c) => c.id === e.affectation.classId)?.name ?? e.affectation.classId,
          matiere: matieres.find((m) => m.id === e.affectation.subjectId)?.name ?? e.affectation.subjectId,
          enseignant: nomEnseignant(e.affectation.teacherId),
          raison: e.raison,
        })),
      },
    ]
  })
}
