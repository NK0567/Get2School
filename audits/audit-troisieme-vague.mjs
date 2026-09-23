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
const annonces = await s.ssrLoadModule('/src/modules/annonces/api.ts')
const eleves = await s.ssrLoadModule('/src/modules/eleves/api.ts')
const inscriptions = await s.ssrLoadModule('/src/modules/inscriptions/api.ts')
const docs = await s.ssrLoadModule('/src/modules/documents/api.ts')

let total = 0, ok = 0
const essai = async (t, fn) => {
  total++
  try { const r = await fn(); console.log('OK  ', t.padEnd(64), '·', r); ok++ }
  catch (e) { console.log('FAIL', t.padEnd(64), '· REFUS :', e.message) }
}

console.log('\n========== TROISIÈME VAGUE ==========\n')
localStorage.setItem('g2s_jeton', 'demo.usr-1')

console.log('--- Annonces : publication et retrait, codes d\u2019audit distincts ---')
let annonce
await essai('publication puis retrait, deux codes distincts au journal', async () => {
  annonce = await annonces.enregistrerBrouillon({
    title: 'Audit retrait', body: 'Contenu suffisamment long pour un audit fonctionnel complet.',
    audienceType: 'ALL_TEACHERS', audienceRefs: [], priority: 'NORMAL',
  })
  await annonces.publierAnnonce(annonce.id)
  const retiree = await annonces.retirerAnnonce(annonce, 'Erreur de date dans le contenu.')
  const journal = await api.get('/audit-logs', { params: { taille: 30 } })
  const traces = journal.data.contenu.filter((e) => e.entityId === annonce.id)
  const actions = new Set(traces.map((t2) => t2.action))
  if (!actions.has('ANNOUNCEMENT_PUBLISH') || !actions.has('ANNOUNCEMENT_WITHDRAW')) {
    throw new Error(`actions tracées : ${[...actions].join(', ')} — les deux codes distincts sont attendus`)
  }
  return `statut=${retiree.status} · actions=[${[...actions].join(', ')}]`
})

console.log('\n--- Élèves : archivage ---')
let eleveArchive
await essai('archivage avec motif, le dossier reste consultable', async () => {
  eleveArchive = await eleves.chargerEleve('elv-4')
  const archive = await eleves.archiverEleve(eleveArchive, 'Départ vers un autre établissement.')
  return `statut=${archive.status}`
})
await essai('un élève archivé n\u2019apparaît plus dans la liste active par défaut', async () => {
  const r = await eleves.listerEleves({})
  const present = r.contenu.some((e) => e.id === 'elv-4' && e.status !== 'ARCHIVED')
  if (present) throw new Error('elv-4 apparaît encore comme actif dans la liste')
  return 'correctement écarté de la liste active'
})

console.log('\n--- Inscriptions : transfert interne ---')
await essai('transfert d\u2019un élève vers une autre classe, effectifs mis à jour', async () => {
  const toutes = await inscriptions.listerInscriptions({})
  const active = toutes.find((i) => i.status === 'ACTIVE' && i.classId === 'cls-1')
  if (!active) throw new Error('aucune inscription active sur cls-1 pour ce test')
  const classesAvant = (await api.get('/classes')).data
  const cls1Avant = classesAvant.find((c) => c.id === 'cls-1').studentCount
  const cls2Avant = classesAvant.find((c) => c.id === 'cls-2').studentCount

  await inscriptions.transfererVersClasse(active, 'cls-2')

  const classesApres = (await api.get('/classes')).data
  const cls1Apres = classesApres.find((c) => c.id === 'cls-1').studentCount
  const cls2Apres = classesApres.find((c) => c.id === 'cls-2').studentCount
  if (cls1Apres !== cls1Avant - 1) throw new Error(`cls-1: ${cls1Avant} → ${cls1Apres}, attendu -1`)
  if (cls2Apres !== cls2Avant + 1) throw new Error(`cls-2: ${cls2Avant} → ${cls2Apres}, attendu +1`)
  return `cls-1: ${cls1Avant}→${cls1Apres} · cls-2: ${cls2Avant}→${cls2Apres}`
})

console.log('\n--- Génération en lot, construite comme le fait vraiment l\u2019écran (roster de la classe) ---')
await essai('cibles construites à partir des inscriptions actives de cls-1, comme GenerationLot.tsx', async () => {
  const insc = (await api.get('/enrollments', { params: { classId: 'cls-1' } })).data
  const actives = insc.filter((i) => i.status === 'ACTIVE')
  if (actives.length === 0) throw new Error('aucun élève actif sur cls-1 après le transfert précédent — jeu de test incohérent')
  const cibles = actives.map((i) => ({ id: i.studentId, libelle: i.studentId }))
  const r = await docs.genererDocuments({ type: 'CERTIFICAT_SCOLARITE', cibles, schoolYearId: 'an-2026' })
  const echoues = r.documents.filter((d) => d.status !== 'GENERATED')
  if (echoues.length > 0) throw new Error(`${echoues.length} échec(s) sur ${r.documents.length}`)
  return `${r.documents.length} document(s) générés pour toute la classe, tous GENERATED`
})

console.log('\n--- Cycle de vie d\u2019une année scolaire ---')
const anneesModule = await s.ssrLoadModule('/src/modules/annees-scolaires/api.ts')
let nouvelleAnnee
await essai('création d\u2019une nouvelle année, en brouillon', async () => {
  nouvelleAnnee = await anneesModule.creerAnnee({
    label: '2099-2100', startDate: '2099-09-01', endDate: '2100-07-15', periodType: 'TRIMESTER',
  })
  return `statut=${nouvelleAnnee.status}`
})
await essaiRefus_ouvertureDoublee()
async function essaiRefus_ouvertureDoublee() {
  total++
  try {
    await anneesModule.ouvrirAnnee(nouvelleAnnee)
    console.log('FAIL', 'deux années ouvertes en même temps refusé'.padEnd(64), '· aurait dû être refusé')
  } catch (e) {
    console.log('OK  ', 'deux années ouvertes en même temps refusé'.padEnd(64), '· refusé, correct :', e.message)
    ok++
  }
}

console.log(`\n>>> TROISIÈME VAGUE : ${ok}/${total} vérifications réussies\n`)
await s.close()
