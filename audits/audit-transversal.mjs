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
const docs = await s.ssrLoadModule('/src/modules/documents/api.ts')
const chrono = await s.ssrLoadModule('/src/modules/chronogramme/api.ts')
const abo = await s.ssrLoadModule('/src/modules/abonnement/api.ts')
const inscription = await s.ssrLoadModule('/src/modules/inscription-etablissement/api.ts')
const eleves = await s.ssrLoadModule('/src/modules/eleves/api.ts')

let total = 0, ok = 0
const essai = async (t, fn) => {
  total++
  try { const r = await fn(); console.log('OK  ', t.padEnd(62), '·', r); ok++ }
  catch (e) { console.log('FAIL', t.padEnd(62), '· REFUS :', e.message) }
}

console.log('\n========== SYSTÈMES TRANSVERSAUX ==========\n')
localStorage.setItem('g2s_jeton', 'demo.usr-1')

console.log('--- Documents : chaque type qui doit avoir du contenu réel en a ---')
const TYPES_A_CONTENU_REEL = [
  ['CERTIFICAT_SCOLARITE', { id: 'elv-1', libelle: 'x' }, undefined],
  ['CARTE_SCOLAIRE', { id: 'elv-1', libelle: 'x' }, undefined],
  ['FICHE_ELEVE', { id: 'elv-1', libelle: 'x' }, undefined],
  ['LISTE_CLASSE', { id: 'cls-1', libelle: 'x' }, undefined],
  ['LISTE_PERSONNEL', { id: 'etb-1', libelle: 'x' }, undefined],
  ['CHRONOGRAMME', { id: 'etb-1', libelle: 'x' }, undefined],
  ['EMPLOI_DU_TEMPS_CLASSE', { id: 'cls-1', libelle: 'x' }, undefined],
  ['BULLETIN', { id: 'elv-1', libelle: 'x' }, 'an-2026-p1'],
]
for (const [type, cible, periodId] of TYPES_A_CONTENU_REEL) {
  await essai(`génération ${type}`, async () => {
    const r = await docs.genererDocuments({ type, cibles: [cible], schoolYearId: 'an-2026', periodId })
    const d = r.documents[0]
    if (d.status !== 'GENERATED') throw new Error(`statut=${d.status} (aucun modèle actif ?)`)
    return `statut=${d.status} · targetType=${d.targetType} · targetLabel="${d.targetLabel ?? '(absent)'}"`
  })
}

console.log('\n--- Chronogramme ---')
await essai('création puis lecture', async () => {
  await chrono.creerEvenement({ kind: 'ACTIVITY', title: 'Audit chronogramme', startDate: '2026-11-01' })
  const r = await chrono.listerEvenements({})
  return `${r.length} événement(s)`
})

console.log('\n--- Abonnement ---')
await essai('statut du Lycée (déjà abonné)', async () => {
  const r = await abo.chargerStatutEssai()
  return `statut=${r.abonnement.statut} · expire=${r.evaluation.expire}`
})

console.log('\n--- Onboarding complet, de zéro à la fiche élève ---')
let nouvel
await essai('inscription établissement', async () => {
  nouvel = await inscription.inscrireEtablissement({
    name: 'Institut Audit Final', category: 'SECONDARY', theme: 'BORDEAUX',
    address: 'x', phone: '+237611111111', email: 'audit@final.cm',
    directorFirstName: 'Directeur', directorLastName: 'Final',
    directorEmail: 'directeur@auditfinal.cm', directorPassword: 'AuditFinal9!',
  })
  return `établissement=${nouvel.etablissement.name} · essai=${nouvel.etablissement.abonnement.statut}`
})
localStorage.setItem('g2s_jeton', nouvel.jeton)
await essai('nouvel établissement : aucune fuite de données des autres établissements', async () => {
  const r = await eleves.listerEleves({})
  return `${r.total} élève(s) (doit être 0, établissement neuf)`
})
await essai('nouvel établissement : document generable dès le premier jour', async () => {
  const r = await docs.genererDocuments({ type: 'CERTIFICAT_SCOLARITE', cibles: [{ id: 'x', libelle: 'x' }], schoolYearId: nouvel.etablissement.id })
  return `statut=${r.documents[0].status}`
})

console.log(`\n>>> SYSTÈMES TRANSVERSAUX : ${ok}/${total} vérifications réussies\n`)
await s.close()
