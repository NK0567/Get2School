/** Assemblage des routes · PROPRIETAIRE : Boris · FIGE */
import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { CoquilleApp } from '../gabarit/CoquilleApp'
import { ExigeAuth } from '../socle/gardes/ExigeAuth'
import { SqueletteTableau } from '../ui'
import { routesAdministration } from './routes-administration'
import { routesScolarite } from './routes-scolarite'
import { routesAcademique } from './routes-academique'

const PageConnexion = lazy(() => import('../modules/authentification/pages/PageConnexion'))

function Attente() {
  return <SqueletteTableau lignes={5} />
}

export const routeur = createBrowserRouter([
  {
    path: '/connexion',
    element: (
      <Suspense fallback={<Attente />}>
        <PageConnexion />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ExigeAuth>
        <CoquilleApp />
      </ExigeAuth>
    ),
    children: [...routesAdministration, ...routesScolarite, ...routesAcademique].map((route) => ({
      ...route,
      element: <Suspense fallback={<Attente />}>{route.element}</Suspense>,
    })),
  },
])
