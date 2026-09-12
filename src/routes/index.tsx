/** Assemblage des routes · PROPRIETAIRE : Boris · FIGE */
import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { CoquilleApp } from '../gabarit/CoquilleApp'
import { ExigeAuth } from '../socle/gardes/ExigeAuth'
import { FrontiereErreur } from '../communs'
import { SqueletteTableau } from '../ui'

import { routesAdministration } from './routes-administration'
import { routesScolarite } from './routes-scolarite'
import { routesAcademique } from './routes-academique'
import { routesCommunes } from './routes-communes'

const PageConnexion = lazy(() => import('../modules/authentification/pages/PageConnexion'))
const PageErreurRoutage = lazy(() => import('../modules/erreurs/pages/PageErreurRoutage'))

function Attente() {
  return <SqueletteTableau lignes={5} />
}

/**
 * Chaque ecran est enveloppe dans une frontiere d'erreur : un plantage dans
 * un module ne fait pas tomber toute l'application pendant une demonstration.
 */
function envelopper(element: React.ReactNode) {
  return (
    <Suspense fallback={<Attente />}>
      <FrontiereErreur>{element}</FrontiereErreur>
    </Suspense>
  )
}

export const routeur = createBrowserRouter([
  {
    path: '/connexion',
    element: (
      <Suspense fallback={<Attente />}>
        <PageConnexion />
      </Suspense>
    ),
    errorElement: (
      <Suspense fallback={<Attente />}>
        <PageErreurRoutage />
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
    errorElement: (
      <Suspense fallback={<Attente />}>
        <PageErreurRoutage />
      </Suspense>
    ),
    children: [...routesAdministration, ...routesScolarite, ...routesAcademique, ...routesCommunes].map(
      (route) => ({ ...route, element: envelopper(route.element) }),
    ),
  },
])
