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
const classes = await s.ssrLoadModule('/src/modules/classes/api.ts')
const bul = await s.ssrLoadModule('/src/modules/bulletins/api.ts')

let total = 0, ok = 0
const essai = async (t, fn) => {
  total++
  try { const r = await fn(); console.log('OK  ', t.padEnd(64), '·', r); ok++ }
  catch (e) { console.log('FAIL', t.padEnd(64), '· REFUS :', e.message) }
}
const essaiRefus = async (t, fn) => {
  total++
  try { await fn(); console.log('FAIL', t.padEnd(64), '· aurait dû être refusé') }
  catch (e) { console.log('OK  ', t.padEnd(64), '· refusé, correct :', e.message); ok++ }
}

console.log('\n========== Prof titulaire et bulletins (RG du cahier des charges) ==========\n')
localStorage.setItem('g2s_jeton', 'demo.usr-1')

await essaiRefus('avant désignation : Serge Mbala (ens-1) n\u2019est titulaire d\u2019aucune classe, accès refusé', async () => {
  localStorage.setItem('g2s_jeton', 'demo.usr-5')
  await bul.chargerClassement('cls-1', 'an-2026-p1')
})

localStorage.setItem('g2s_jeton', 'demo.usr-1')
let cls1
await essai('le Directeur désigne Serge Mbala titulaire de cls-1', async () => {
  const toutes = (await api.get('/classes')).data
  cls1 = toutes.find((c) => c.id === 'cls-1')
  const maj = await classes.modifierClasse(cls1, { headTeacherId: 'ens-1' })
  return `headTeacherId=${maj.headTeacherId}`
})

await essai('Serge Mbala peut maintenant consulter le classement de SA classe', async () => {
  localStorage.setItem('g2s_jeton', 'demo.usr-5')
  const r = await bul.chargerClassement('cls-1', 'an-2026-p1')
  return `${r.length} élève(s) classé(s)`
})

await essaiRefus('Serge Mbala ne peut toujours pas consulter le classement de cls-2, dont il n\u2019est pas titulaire', () =>
  bul.chargerClassement('cls-2', 'an-2026-p1'))

console.log('\n--- le bulletin individuel reste régi par l\u2019affectation à une matière, pas le titulariat (comportement préexistant) ---')
await essai('Claire Fotso (français, affectée à cls-1) peut consulter un bulletin d\u2019élève de cls-1', async () => {
  localStorage.setItem('g2s_jeton', 'demo.usr-6')
  const r = await bul.chargerBulletin('ins-1', 'an-2026-p1')
  return `moyenne générale=${r.general.average}`
})

console.log('\n--- rôles administratifs, jamais affectés à une classe : accès toujours libre ---')
localStorage.setItem('g2s_jeton', 'demo.usr-1')
await essai('le Directeur consulte n\u2019importe quel classement sans restriction', async () => {
  const r = await bul.chargerClassement('cls-2', 'an-2026-p1')
  return `${r.length} élève(s) classé(s)`
})

console.log(`\n>>> TITULARIAT ET BULLETINS : ${ok}/${total} vérifications réussies\n`)
await s.close()
