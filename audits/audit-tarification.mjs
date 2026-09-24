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
const inscription = await s.ssrLoadModule('/src/modules/inscription-etablissement/api.ts')
const abo = await s.ssrLoadModule('/src/modules/abonnement/api.ts')

let total = 0, ok = 0
const essai = async (t, fn) => {
  total++
  try { const r = await fn(); console.log('OK  ', t.padEnd(64), '·', r); ok++ }
  catch (e) { console.log('FAIL', t.padEnd(64), '· REFUS :', e.message) }
}

console.log('\n========== Tarification primaire/secondaire, dérivée du serveur ==========\n')

let ecolePrimaire
await essai('inscription d\u2019une école primaire', async () => {
  ecolePrimaire = await inscription.inscrireEtablissement({
    name: 'École Primaire Tarif', category: 'PRIMARY', theme: 'VERT',
    address: 'x', phone: '+237622222222', email: 'x@x.cm',
    directorFirstName: 'Directrice', directorLastName: 'Tarif',
    directorEmail: 'd.tarif@primaire.cm', directorPassword: 'TarifSolide9!',
  })
  return `catégorie=${ecolePrimaire.etablissement.category}`
})
localStorage.setItem('g2s_jeton', ecolePrimaire.jeton)

await essai('le statut renvoie la vraie catégorie, avant tout abonnement', async () => {
  const r = await abo.chargerStatutEssai()
  return `categorie=${r.categorie} (attendu PRIMARY)`
})

await essai('s\u2019abonner ne demande plus aucun plan : le serveur le déduit seul', async () => {
  const r = await abo.sabonner()
  if (r.planId !== 'PRIMARY') throw new Error(`planId=${r.planId}, attendu PRIMARY`)
  return `planId=${r.planId}, correctement dérivé de la catégorie de l'établissement`
})

console.log('\n--- tentative de manipulation directe : envoyer un planId au corps de la requête ---')
let ecoleSecondaire
await essai('inscription d\u2019un établissement secondaire, pour comparaison', async () => {
  ecoleSecondaire = await inscription.inscrireEtablissement({
    name: 'Lycée Tarif Test', category: 'SECONDARY', theme: 'BLEU',
    address: 'x', phone: '+237633333333', email: 'y@y.cm',
    directorFirstName: 'Directeur', directorLastName: 'TarifSecondaire',
    directorEmail: 'd.tarifsec@secondaire.cm', directorPassword: 'AutreSolide9!',
  })
  return `catégorie=${ecoleSecondaire.etablissement.category}`
})
localStorage.setItem('g2s_jeton', ecoleSecondaire.jeton)

await essai('un établissement secondaire ne peut pas s\u2019abonner au tarif primaire en le demandant dans le corps', async () => {
  // Même en insistant côté client, l'endpoint ignore tout planId reçu.
  const r = await api.post('/subscription/subscribe', { planId: 'PRIMARY' })
  if (r.data.planId !== 'SECONDARY') {
    throw new Error(`planId=${r.data.planId} — FAILLE : un établissement secondaire a obtenu le tarif primaire`)
  }
  return `planId=${r.data.planId}, la tentative de manipulation a été ignorée, correct`
})

console.log(`\n>>> TARIFICATION : ${ok}/${total} vérifications réussies\n`)
await s.close()
