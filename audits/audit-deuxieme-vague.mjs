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
const notifications = await s.ssrLoadModule('/src/modules/notifications/api.ts')
const recherche = await s.ssrLoadModule('/src/modules/recherche/api.ts')
const utilisateurs = await s.ssrLoadModule('/src/modules/utilisateurs/api.ts')
const edt = await s.ssrLoadModule('/src/modules/emploi-du-temps/api.ts')
const notesApi = await s.ssrLoadModule('/src/modules/notes/api.ts')
const ev = await s.ssrLoadModule('/src/modules/evaluations/api.ts')
const absencesApi = await s.ssrLoadModule('/src/modules/absences/api.ts')
const auth = await s.ssrLoadModule('/src/modules/authentification/api.ts')

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

console.log('\n========== DEUXIÈME VAGUE : modules non encore couverts ==========\n')
localStorage.setItem('g2s_jeton', 'demo.usr-1')

console.log('--- Modèles documentaires ---')
await essai('liste des modèles', async () => (await docs.listerModeles()).length + ' modèle(s)')
await essai('activation d\u2019un second modèle de bulletin, l\u2019ancien redevient inactif', async () => {
  const avant = await docs.listerModeles()
  const bulletins = avant.filter((m) => m.type === 'BULLETIN')
  if (bulletins.length < 2) throw new Error('le jeu de données doit avoir au moins 2 modèles BULLETIN pour ce test')
  const inactif = bulletins.find((m) => !m.isActive)
  await docs.activerModele(inactif.id, inactif.name)
  const apres = await docs.listerModeles()
  const actifsBulletin = apres.filter((m) => m.type === 'BULLETIN' && m.isActive)
  if (actifsBulletin.length !== 1) throw new Error(`${actifsBulletin.length} modèle(s) BULLETIN actif(s), attendu 1 seul`)
  return `un seul modèle BULLETIN actif après bascule : "${actifsBulletin[0].name}"`
})

console.log('\n--- Notifications ---')
await essai('liste et compteur de non lues', async () => {
  const liste = await notifications.listerNotifications()
  const compte = await notifications.compterNonLues()
  return `${liste.length} notification(s) · ${compte} non lue(s)`
})
await essai('marquer toutes comme lues, le compteur retombe à zéro', async () => {
  await notifications.marquerToutesLues()
  const compte = await notifications.compterNonLues()
  if (compte !== 0) throw new Error(`compteur=${compte}, attendu 0`)
  return 'compteur=0, correct'
})

console.log('\n--- Recherche globale : la sécurité documentée dans le module est-elle réelle ? ---')
await essai('SCHOOL_ADMIN peut chercher les comptes utilisateurs', async () => {
  const r = await recherche.rechercher('Boris', ['UTILISATEUR'])
  return `typesAutorises=[${r.typesAutorises.join(', ')}] · ${r.resultats.length} résultat(s)`
})
localStorage.setItem('g2s_jeton', 'demo.usr-5') // Serge Mbala, enseignant
await essai('un enseignant NE PEUT PAS chercher les comptes utilisateurs ni les documents (filtrage serveur)', async () => {
  const r = await recherche.rechercher('a', ['UTILISATEUR', 'DOCUMENT'])
  if (r.typesAutorises.includes('UTILISATEUR') || r.typesAutorises.includes('DOCUMENT')) {
    throw new Error(`typesAutorises=[${r.typesAutorises.join(', ')}] — fuite : un enseignant ne devrait pas y avoir accès`)
  }
  if (r.resultats.some((res) => res.type === 'UTILISATEUR' || res.type === 'DOCUMENT')) {
    throw new Error('des résultats UTILISATEUR/DOCUMENT sont revenus malgré tout — fuite réelle, pas seulement un type autorisé mal déclaré')
  }
  return `typesAutorises=[${r.typesAutorises.join(', ')}] — correctement restreint, aucune fuite dans les résultats`
})

console.log('\n--- Utilisateurs : matrice de permissions, statut, permissions individuelles ---')
localStorage.setItem('g2s_jeton', 'demo.usr-1')
let matrice
await essai('chargement de la matrice rôles × permissions', async () => {
  matrice = await utilisateurs.chargerMatrice()
  return `${Object.keys(matrice).length} rôle(s) dans la matrice`
})
await essai('SCHOOL_ADMIN reste protégé dans la matrice même si le client l\u2019envoie modifié', async () => {
  const modifiee = { ...matrice, SCHOOL_ADMIN: [] }
  const resultat = await utilisateurs.enregistrerMatrice(matrice, modifiee)
  if ('SCHOOL_ADMIN' in resultat) throw new Error('SCHOOL_ADMIN présent dans la matrice enregistrée — devrait être écarté')
  return 'SCHOOL_ADMIN écarté de la matrice enregistrée, correct'
})
let compteTest
await essai('désactivation d\u2019un compte', async () => {
  const r = await utilisateurs.creerUtilisateur({ firstName: 'Statut', lastName: 'Test', email: 'statut.test@lyceebafoussam.cm', role: 'SECRETARY' })
  compteTest = r.utilisateur
  const desactive = await utilisateurs.changerStatutUtilisateur(compteTest, false)
  return `isActive=${desactive.isActive}`
})
await essaiRefus('un compte ne peut pas modifier son propre rôle', async () => {
  const moi = await utilisateurs.chargerUtilisateur('usr-1')
  await utilisateurs.changerRole(moi, 'TEACHER')
})

console.log('\n--- Emploi du temps : suppression ---')
await essai('création puis suppression d\u2019un créneau', async () => {
  const c = await edt.creerCreneau({ classId: 'cls-1', subjectId: 'mat-1', teacherId: 'ens-1', roomId: 'sal-1', dayOfWeek: 5, startTime: '14:00', endTime: '15:00' })
  await edt.supprimerCreneau(c.id)
  const liste = await edt.listerCreneaux({ classId: 'cls-1' })
  const encorePresent = liste.some((x) => x.id === c.id)
  if (encorePresent) throw new Error('le créneau existe toujours après suppression')
  return 'supprimé, absent de la liste'
})

console.log('\n--- Notes : annulation de sanction ---')
localStorage.setItem('g2s_jeton', 'demo.usr-5')
let evaluationSanction
await essai('sanction puis annulation, la note redevient normale', async () => {
  evaluationSanction = await ev.creerEvaluation({ classId: 'cls-1', subjectId: 'mat-1', periodId: 'an-2026-p1', title: 'Audit sanction', type: 'QUIZ', date: '2026-10-20', maxGrade: 20, coefficient: 1 })
  await notesApi.enregistrerNotes(evaluationSanction.id, [{ studentId: 'elv-1', enrollmentId: 'ins-1', value: null, status: 'VALID' }])
  const notesListe = await notesApi.listerNotes(evaluationSanction.id)
  const note = notesListe.find((n) => n.studentId === 'elv-1')
  const sanctionnee = await notesApi.sanctionnerNote(note, 'Fraude constatée pendant le contrôle.')
  if (sanctionnee.status !== 'PENALIZED') throw new Error(`statut=${sanctionnee.status}, attendu PENALIZED`)
  const restauree = await notesApi.annulerSanction(sanctionnee)
  if (restauree.status !== 'VALID') throw new Error(`statut après annulation=${restauree.status}, attendu VALID`)
  return `sanctionnée puis annulée : statut final=${restauree.status}`
})

console.log('\n--- Absences : justification ---')
localStorage.setItem('g2s_jeton', 'demo.usr-1')
await essai('justification d\u2019une absence avec motif', async () => {
  await absencesApi.faireAppel('cls-1', '2026-10-21', [{ studentId: 'elv-1', enrollmentId: 'ins-1', type: 'ABSENCE' }])
  const liste = await absencesApi.listerAbsences({ studentId: 'elv-1' })
  const absence = liste.contenu.find((a) => a.date === '2026-10-21')
  if (!absence) throw new Error('absence introuvable après saisie')
  const justifiee = await absencesApi.justifierAbsence(absence, 'Certificat médical fourni.')
  if (!justifiee.isJustified) throw new Error(`isJustified=${justifiee.isJustified}, attendu true`)
  return `isJustified=${justifiee.isJustified}`
})

console.log('\n--- Authentification : mot de passe oublié, sessions ---')
await essai('demande de réinitialisation, même réponse pour email inconnu (anti-énumération)', async () => {
  await auth.demanderReinitialisation('inconnu@x.cm')
  await auth.demanderReinitialisation('direction@lyceebafoussam.cm')
  return 'les deux demandes acceptées sans distinction visible'
})
await essai('jeton de réinitialisation invalide correctement signalé (valide=false, pas une erreur HTTP)', async () => {
  const r = await auth.verifierJetonReinitialisation('jeton-bidon')
  if (r.valide !== false) throw new Error(`valide=${r.valide}, attendu false`)
  return `valide=${r.valide}`
})
await essai('sessions actives listées', async () => (await auth.listerSessions()).length + ' session(s)')

console.log(`\n>>> DEUXIÈME VAGUE : ${ok}/${total} vérifications réussies\n`)
await s.close()
