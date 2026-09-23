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
const affectations = await s.ssrLoadModule('/src/modules/affectations/api.ts')

let total = 0, ok = 0
const essai = async (t, fn) => {
  total++
  try { const r = await fn(); console.log('OK  ', t.padEnd(62), '·', r); ok++ }
  catch (e) { console.log('FAIL', t.padEnd(62), '· REFUS :', e.message) }
}

localStorage.setItem('g2s_jeton', 'demo.usr-1')

console.log('\n--- Onglet Affectations de la fiche classe (cls-1) ---')
await essai('les affectations de cls-1 se récupèrent avec matière et enseignant résolvables', async () => {
  const r = await affectations.listerAffectations({ classId: 'cls-1' })
  if (r.length === 0) throw new Error('aucune affectation pour cls-1 dans le jeu de données — le test perd son sens')
  const matieres = (await api.get('/subjects')).data
  const enseignants = (await api.get('/teachers')).data
  const ligne = r[0]
  const matiere = matieres.find((m) => m.id === ligne.subjectId)
  const enseignant = enseignants.find((e) => e.id === ligne.teacherId)
  if (!matiere || !enseignant) throw new Error('matière ou enseignant introuvable pour cette affectation')
  return `${r.length} affectation(s) · première: ${matiere.name} · ${enseignant.firstName} ${enseignant.lastName}`
})

console.log('\n--- Onglet Classes et matières de la fiche enseignant (ens-1) ---')
await essai('les affectations de ens-1 se récupèrent avec classe et matière résolvables', async () => {
  const r = await affectations.listerAffectations({ teacherId: 'ens-1' })
  if (r.length === 0) throw new Error('aucune affectation pour ens-1 dans le jeu de données — le test perd son sens')
  const classes = (await api.get('/classes')).data
  const matieres = (await api.get('/subjects')).data
  const cohérent = r.every((a) => classes.some((c) => c.id === a.classId) && matieres.some((m) => m.id === a.subjectId))
  if (!cohérent) throw new Error('au moins une affectation référence une classe ou une matière introuvable')
  return `${r.length} affectation(s), toutes résolvables`
})

console.log('\n--- Cohérence croisée : ce que montre la fiche classe et la fiche enseignant doit être le même lien ---')
await essai('l\u2019affectation vue depuis cls-1 apparaît aussi depuis le bon enseignant', async () => {
  const depuisClasse = await affectations.listerAffectations({ classId: 'cls-1' })
  const premiere = depuisClasse[0]
  const depuisEnseignant = await affectations.listerAffectations({ teacherId: premiere.teacherId })
  const presente = depuisEnseignant.some((a) => a.id === premiere.id)
  if (!presente) throw new Error('la même affectation, vue depuis les deux fiches, ne coïncide pas')
  return 'cohérent des deux côtés'
})

console.log(`\n>>> ONGLETS AFFECTATIONS : ${ok}/${total} vérifications réussies\n`)
await s.close()
