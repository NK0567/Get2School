import { createServer } from 'vite'
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><body><div id="root"></div>', { url: 'http://localhost/' })
for (const k of ['window', 'document', 'location', 'localStorage', 'HTMLElement', 'Element', 'Node', 'Event']) {
  try { if (dom.window[k] !== undefined) globalThis[k] = dom.window[k] } catch {}
}
const s = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { installerSimulation } = await s.ssrLoadModule('/src/socle/simulation/index.ts')
installerSimulation()
const { api } = await s.ssrLoadModule('/src/socle/api/client.ts')
const eleves = await s.ssrLoadModule('/src/modules/eleves/api.ts')
const inscriptions = await s.ssrLoadModule('/src/modules/inscriptions/api.ts')
const enseignants = await s.ssrLoadModule('/src/modules/enseignants/api.ts')
const classes = await s.ssrLoadModule('/src/modules/classes/api.ts')
const matieres = await s.ssrLoadModule('/src/modules/matieres/api.ts')
const salles = await s.ssrLoadModule('/src/modules/salles/api.ts')
const affectations = await s.ssrLoadModule('/src/modules/affectations/api.ts')
const edt = await s.ssrLoadModule('/src/modules/emploi-du-temps/api.ts')
const fin = await s.ssrLoadModule('/src/modules/finances/api.ts')

let total = 0, ok = 0
const essai = async (t, fn) => {
  total++
  try { const r = await fn(); console.log('OK  ', t.padEnd(62), '·', r); ok++ }
  catch (e) { console.log('FAIL', t.padEnd(62), '· REFUS :', e.message) }
}
const essaiRefus = async (t, fn) => {
  total++
  try { await fn(); console.log('FAIL', t.padEnd(62), '· aurait dû être refusé') }
  catch (e) { console.log('OK  ', t.padEnd(62), '· refusé, correct :', e.message); ok++ }
}

console.log('\n========== LOT B (Alida) ==========\n')
localStorage.setItem('g2s_jeton', 'demo.usr-1')

console.log('--- Classes, matières, salles ---')
let classe
await essai('création de classe', async () => {
  classe = await classes.creerClasse({ name: 'Audit-1', level: 'Terminale', capacity: 30 })
  return `${classe.name}, capacité=${classe.capacity}`
})
let matiere
await essai('création de matière', async () => {
  matiere = await matieres.creerMatiere({ name: 'Audit-Matière', code: 'AUD', coefficient: 3, maxGrade: 20 })
  return `coef=${matiere.coefficient}`
})
await essai('salle créée', async () => (await salles.creerSalle({ name: 'Audit-Salle', capacity: 20, type: 'CLASSROOM' })).name)

console.log('\n--- Élèves et inscriptions ---')
let eleve
await essai('création élève, matricule généré, inscription automatique', async () => {
  eleve = await eleves.creerEleve({
    firstName: 'Test', lastName: 'Audit', birthDate: '2010-01-01', birthPlace: 'Bafoussam',
    gender: 'M', guardianName: 'Parent Audit', guardianPhone: '+237600000099',
    guardianRelationship: 'FATHER', classId: classe.id,
  })
  return `matricule=${eleve.matricule}`
})
await essaiRefus('une deuxième inscription active pour le même élève, même année, refusée (RG-04)', () =>
  inscriptions.reinscrire(eleve.id, classe.id))

console.log('\n--- Enseignants et affectations ---')
let enseignant
await essai('création enseignant', async () => {
  enseignant = await enseignants.creerEnseignant({
    firstName: 'Prof', lastName: 'Audit', phone: '+237600000098', subjectIds: [matiere.id],
  })
  return enseignant.firstName
})
let affectation
await essai('affectation (enseignant, matière, classe)', async () => {
  affectation = await affectations.creerAffectation({ teacherId: enseignant.id, subjectId: matiere.id, classId: classe.id })
  return 'créée'
})
await essaiRefus('affectation en double refusée', () =>
  affectations.creerAffectation({ teacherId: enseignant.id, subjectId: matiere.id, classId: classe.id }))

console.log('\n--- Emploi du temps ---')
let creneau
await essai('création de créneau', async () => {
  creneau = await edt.creerCreneau({
    classId: classe.id, subjectId: matiere.id, teacherId: enseignant.id, roomId: 'sal-1',
    dayOfWeek: 3, startTime: '10:00', endTime: '11:00',
  })
  return 'créé'
})
await essaiRefus('même enseignant, créneau chevauchant, refusé', () =>
  edt.creerCreneau({
    classId: 'cls-1', subjectId: 'mat-1', teacherId: enseignant.id, roomId: 'sal-2',
    dayOfWeek: 3, startTime: '10:30', endTime: '11:30',
  }))

console.log('\n--- Finance ---')
let frais
await essai('création de frais avec échéancier', async () => {
  frais = await fin.creerFrais({
    label: 'Frais audit', scope: 'ALL', isMandatory: true,
    installments: [{ label: 'Solde', amount: 10000, dueDate: '2026-11-01' }],
  })
  return `montant=${frais.amount} (recalculé serveur depuis les tranches)`
})
await essai('situation financière élève neuf : impayé', async () => {
  const s2 = await fin.chargerSituation(eleve.id)
  return `statut=${s2.status} · dû=${s2.due}`
})
let paiement
let inscriptionEleve
await essai('enregistrement d\u2019un paiement, reçu généré', async () => {
  const inscriptionsEleve = await api.get('/enrollments', { params: { studentId: eleve.id } })
  inscriptionEleve = inscriptionsEleve.data[0]
  const r = await fin.enregistrerPaiement({
    studentId: eleve.id, enrollmentId: inscriptionEleve.id, feeItemId: frais.id,
    amount: 10000, method: 'CASH',
  })
  paiement = r.paiement
  return `reçu=${r.recu.number}`
})
await essai('situation mise à jour après paiement : le dû baisse exactement du montant payé', async () => {
  const s2 = await fin.chargerSituation(eleve.id)
  const attendu = 150000 // frais de scolarité déjà présent dans le jeu de données, non réglé par ce nouvel élève
  if (s2.due !== attendu + 10000) throw new Error(`dû=${s2.due}, attendu ${attendu + 10000}`)
  if (s2.paid !== 10000) throw new Error(`payé=${s2.paid}, attendu 10000`)
  if (s2.balance !== attendu) throw new Error(`solde=${s2.balance}, attendu ${attendu}`)
  return `statut=${s2.status} · dû=${s2.due} · payé=${s2.paid} · solde=${s2.balance} — cohérent`
})
await essai('paiement du solde restant : bascule à PAID', async () => {
  await fin.enregistrerPaiement({
    studentId: eleve.id, enrollmentId: inscriptionEleve.id, feeItemId: 'fr-1', amount: 150000, method: 'CASH',
  })
  const s2 = await fin.chargerSituation(eleve.id)
  if (s2.status !== 'PAID') throw new Error(`statut=${s2.status}, attendu PAID`)
  return `statut=${s2.status}`
})
await essaiRefus('annulation de paiement sans motif refusée', () => fin.annulerPaiement(paiement, ''))

console.log(`\n>>> LOT B : ${ok}/${total} vérifications réussies\n`)
await s.close()
