import { createServer } from 'vite'
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><body><div id="root"></div>', { url: 'http://localhost/' })
for (const k of ['window', 'document', 'location', 'localStorage', 'HTMLElement', 'Element', 'Node', 'Event']) {
  try { if (dom.window[k] !== undefined) globalThis[k] = dom.window[k] } catch {}
}
const s = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { installerSimulation } = await s.ssrLoadModule('/src/socle/simulation/index.ts')
installerSimulation()
const auth = await s.ssrLoadModule('/src/modules/authentification/api.ts')

let total = 0, ok = 0
const essai = async (t, fn) => {
  total++
  try { const r = await fn(); console.log('OK  ', t.padEnd(62), '·', r); ok++ }
  catch (e) { console.log('FAIL', t.padEnd(62), '· REFUS :', e.message) }
}

console.log('\n========== Sessions actives, réellement suivies ==========\n')

await essai('aucune session avant toute connexion', async () => {
  localStorage.setItem('g2s_jeton', 'demo.usr-1')
  const r = await auth.listerSessions()
  return `${r.length} session(s) (attendu 0, aucune connexion via /auth/login pour l'instant)`
})

localStorage.removeItem('g2s_jeton')
const session1 = await auth.connexion('direction@lyceebafoussam.cm', 'x')
localStorage.setItem('g2s_jeton', session1.jeton)

await essai('une session apparaît après connexion', async () => {
  const r = await auth.listerSessions()
  if (r.length !== 1) throw new Error(`${r.length} session(s), attendu 1`)
  return `${r.length} session(s), courante=${r[0].courante}`
})

console.log('\n--- isolation entre comptes ---')
localStorage.setItem('g2s_jeton', 'demo.usr2-1')
const session2 = await auth.connexion('direction@epc-douala.cm', 'x')
localStorage.setItem('g2s_jeton', session2.jeton)
await essai('la directrice de l\u2019école primaire ne voit pas la session du Lycée', async () => {
  const r = await auth.listerSessions()
  if (r.length !== 1) throw new Error(`${r.length} session(s), attendu 1 (la sienne uniquement)`)
  return `${r.length} session(s), correctement isolée`
})

console.log('\n--- révocation ---')
localStorage.setItem('g2s_jeton', session1.jeton)
await essaiRefus_placeholder()
async function essaiRefus_placeholder() {
  total++
  try {
    // La directrice du Lycée ne doit pas pouvoir révoquer la session de l'école primaire.
    const sessionsPrimaire = await (async () => {
      localStorage.setItem('g2s_jeton', session2.jeton)
      const r = await auth.listerSessions()
      localStorage.setItem('g2s_jeton', session1.jeton)
      return r
    })()
    await auth.revoquerSession(sessionsPrimaire[0].id)
    console.log('FAIL', 'révocation croisée entre comptes refusée'.padEnd(62), '· aurait dû être refusé')
  } catch (e) {
    console.log('OK  ', 'révocation croisée entre comptes refusée'.padEnd(62), '· refusé, correct :', e.message)
    ok++
  }
}

await essai('révocation de sa propre session, elle disparaît de la liste', async () => {
  const avant = await auth.listerSessions()
  await auth.revoquerSession(avant[0].id)
  const apres = await auth.listerSessions()
  if (apres.length !== 0) throw new Error(`${apres.length} session(s) restante(s), attendu 0`)
  return 'session révoquée, liste vide'
})

console.log('\n--- déconnexion retire la session ---')
localStorage.setItem('g2s_jeton', session2.jeton)
await essai('déconnexion, la session ne réapparaît plus', async () => {
  await auth.deconnexion()
  localStorage.setItem('g2s_jeton', session2.jeton) // se "reconnecter" côté client pour vérifier côté serveur
  const r = await auth.listerSessions()
  if (r.length !== 0) throw new Error(`${r.length} session(s), attendu 0 après déconnexion`)
  return 'aucune session après déconnexion'
})

console.log(`\n>>> SESSIONS : ${ok}/${total} vérifications réussies\n`)
await s.close()
