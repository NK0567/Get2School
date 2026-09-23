import { createServer } from 'vite'

const s = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const calc = await s.ssrLoadModule('/src/modules/abonnement/calculs.ts')

const essai = (titre, obtenu, attendu) => {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu)
  console.log(ok ? 'OK  ' : 'FAIL', titre.padEnd(62), '· obtenu:', JSON.stringify(obtenu), ok ? '' : `· attendu: ${JSON.stringify(attendu)}`)
}

// 1. Abonnement actif, avant l'échéance : toujours valable
essai(
  '1. abonnement actif, avant expireLe : non expiré',
  calc.evaluerEssai(
    { statut: 'ACTIF', essaiDebute: '2026-01-01', expireLe: '2027-07-15' },
    new Date('2027-01-01'),
  ).expire,
  false,
)

// 2. Abonnement actif, après l'échéance : doit expirer (c'était le bug)
essai(
  '2. abonnement actif, après expireLe : expiré — c\u2019était le bug corrigé',
  calc.evaluerEssai(
    { statut: 'ACTIF', essaiDebute: '2026-01-01', expireLe: '2027-07-15' },
    new Date('2027-08-01'),
  ).expire,
  true,
)

// 3. Abonnement actif sans expireLe renseigné (ne devrait pas arriver en pratique,
// mais ne doit jamais planter) : reste valable
essai(
  '3. abonnement actif sans expireLe : ne plante pas, reste valable',
  calc.evaluerEssai({ statut: 'ACTIF', essaiDebute: '2026-01-01' }, new Date('2030-01-01')).expire,
  false,
)

// 4. Exactement le jour de l'échéance : encore valable (le jour même compte)
essai(
  '4. le jour même de l\u2019échéance : encore valable',
  calc.evaluerEssai(
    { statut: 'ACTIF', essaiDebute: '2026-01-01', expireLe: '2027-07-15' },
    new Date('2027-07-15T08:00:00'),
  ).expire,
  false,
)

await s.close()
