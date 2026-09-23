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
const auth = await s.ssrLoadModule('/src/modules/authentification/api.ts')
const utilisateurs = await s.ssrLoadModule('/src/modules/utilisateurs/api.ts')
const anneesScolaires = await s.ssrLoadModule('/src/modules/annees-scolaires/api.ts')
const docs = await s.ssrLoadModule('/src/modules/documents/api.ts')
const annonces = await s.ssrLoadModule('/src/modules/annonces/api.ts')

let total = 0, ok = 0
const essai = async (t, fn) => {
  total++
  try {
    const r = await fn()
    console.log('OK  ', t.padEnd(62), '·', r)
    ok++
  } catch (e) {
    console.log('FAIL', t.padEnd(62), '· REFUS :', e.message)
  }
}
const essaiRefus = async (t, fn) => {
  total++
  try {
    await fn()
    console.log('FAIL', t.padEnd(62), '· aurait dû être refusé')
  } catch (e) {
    console.log('OK  ', t.padEnd(62), '· refusé, correct :', e.message)
    ok++
  }
}

console.log('\n========== LOT A (Boris) ==========\n')

console.log('--- Authentification ---')
await essaiRefus('email inconnu refusé', () => auth.connexion('inconnu@x.cm', 'x'))
let session
await essai('connexion valide', async () => {
  session = await auth.connexion('direction@lyceebafoussam.cm', 'x')
  return `${session.utilisateur.firstName} ${session.utilisateur.lastName}, rôle=${session.utilisateur.role}`
})
localStorage.setItem('g2s_jeton', session.jeton)
await essai('déconnexion', async () => { await auth.deconnexion(); return 'ok' })
localStorage.setItem('g2s_jeton', session.jeton) // se reconnecter pour la suite

console.log('\n--- Utilisateurs ---')
let nouveauCompte
await essai('création avec mot de passe par défaut', async () => {
  nouveauCompte = await utilisateurs.creerUtilisateur({
    firstName: 'Test', lastName: 'Audit', email: 'test.audit@lyceebafoussam.cm', role: 'SECRETARY',
  })
  return `mustChangePassword=${nouveauCompte.utilisateur.mustChangePassword} · motDePasse="${nouveauCompte.motDePasseParDefaut}"`
})
await essaiRefus('email en double refusé', () =>
  utilisateurs.creerUtilisateur({ firstName: 'X', lastName: 'Y', email: 'test.audit@lyceebafoussam.cm', role: 'TEACHER' }))
await essai('changement de rôle', async () => {
  const r = await utilisateurs.changerRole(nouveauCompte.utilisateur, 'ACADEMIC_HEAD')
  return `nouveau rôle=${r.role}`
})

console.log('\n--- Années scolaires ---')
await essaiRefus('deux années au même libellé refusées', () =>
  anneesScolaires.creerAnnee({ label: '2026-2027', startDate: '2026-09-01', endDate: '2027-07-15', periodType: 'TRIMESTER' }))

console.log('\n--- Documents ---')
let certificat
await essai('génération certificat de scolarité', async () => {
  const r = await docs.genererDocuments({ type: 'CERTIFICAT_SCOLARITE', cibles: [{ id: 'elv-1', libelle: 'x' }], schoolYearId: 'an-2026' })
  certificat = r.documents[0]
  return `statut=${certificat.status} · targetId=${certificat.targetId} (doit être un vrai id, pas un libellé)`
})
await essai('vérification publique, sans connexion', async () => {
  localStorage.removeItem('g2s_jeton')
  const v = await docs.verifierDocument(certificat.reference)
  localStorage.setItem('g2s_jeton', session.jeton)
  return `valide=${v.valide} · titulaire="${v.titulaire}"`
})
await essai('annulation avec motif', async () => {
  const r = await docs.annulerDocument(certificat, 'Erreur de saisie')
  return `statut=${r.status}`
})
await essaiRefus('annulation sans motif refusée', () => docs.annulerDocument(certificat, ''))

console.log('\n--- Annonces ---')
let annonce
await essai('création en brouillon', async () => {
  annonce = await annonces.enregistrerBrouillon({
    title: 'Audit', body: 'Contenu de test pour audit fonctionnel complet.',
    audienceType: 'ALL_TEACHERS', audienceRefs: [], priority: 'NORMAL',
  })
  return `statut=${annonce.status}`
})
await essai('diffusion', async () => {
  const r = await annonces.publierAnnonce(annonce.id)
  return `statut=${r.status}`
})

console.log(`\n>>> LOT A : ${ok}/${total} vérifications réussies\n`)
globalThis.__auditA = { ok, total }
await s.close()
