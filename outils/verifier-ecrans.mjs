#!/usr/bin/env node
/**
 * Vérifie que chaque écran écrit est réellement atteignable.
 *
 * Ce contrôle existe parce qu'un module entier a été livré une fois sans être
 * déclaré dans les routes : le code compilait, le lint passait, et les écrans
 * étaient inaccessibles. Un défaut invisible pour le compilateur doit être
 * détecté par un contrôle explicite.
 *
 * Lancé par « npm run verifier », donc avant chaque pull request.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const RACINE = 'src'
const DOSSIER_ROUTES = join(RACINE, 'routes')

function parcourir(dossier, fichiers = []) {
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree)
    if (statSync(chemin).isDirectory()) parcourir(chemin, fichiers)
    else if (/\.(ts|tsx)$/.test(entree)) fichiers.push(chemin)
  }
  return fichiers
}

const tousLesFichiers = parcourir(RACINE)

const pages = tousLesFichiers.filter((f) => f.includes(`${join('', 'pages')}${'/'}`) || /\/pages\//.test(f.replace(/\\/g, '/')))

const contenuRoutes = parcourir(DOSSIER_ROUTES)
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')

const problemes = []

/* 1. Toute page est-elle référencée par une table de routes ? */
for (const page of pages) {
  const nom = page.replace(/\\/g, '/').split('/').pop().replace(/\.tsx?$/, '')
  if (!contenuRoutes.includes(`/${nom}'`)) {
    problemes.push(`Écran non routé : ${page}`)
  }
}

/* 2. Reste-t-il des écrans en construction ? (avertissement, pas une erreur) */
const enConstruction = [...contenuRoutes.matchAll(/EnConstruction titre="([^"]+)"/g)].map(
  (m) => m[1],
)

/* 3. Chaque entrée de menu pointe-t-elle vers une route déclarée ? */
const contenuMenus = parcourir(join(RACINE, 'gabarit', 'menu'))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')

const cheminsMenu = [...contenuMenus.matchAll(/chemin:\s*'([^']+)'/g)].map((m) => m[1])
const cheminsRoutes = [...contenuRoutes.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1])

for (const chemin of cheminsMenu) {
  const nu = chemin.replace(/^\//, '')
  const declare = cheminsRoutes.some((r) => r.replace(/^\//, '') === nu)
  if (!declare) problemes.push(`Entrée de menu sans route : ${chemin}`)
}

/* Résultat */
if (problemes.length > 0) {
  console.error('\nContrôle des écrans : échec\n')
  for (const probleme of problemes) console.error('  ✗ ' + probleme)
  console.error('')
  process.exit(1)
}

console.log(
  `Contrôle des écrans : ${pages.length} écrans routés, ${cheminsMenu.length} entrées de menu valides` +
    (enConstruction.length > 0
      ? `, ${enConstruction.length} en construction (${enConstruction.join(', ')})`
      : ''),
)
