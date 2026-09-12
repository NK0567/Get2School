/**
 * Installation de la simulation · PROPRIETAIRE : Boris · FIGE
 *
 * Ce fichier n'evolue que si un lot est ajoute ou retire. Chaque lot ecrit
 * uniquement ses deux fichiers : donnees-<lot>.ts et routes-<lot>.ts.
 */
import MockAdapter from 'axios-mock-adapter'
import { api } from '../api/client'
import { initialiserBase } from './base'

import { donneesAdministration } from './donnees-administration'
import { donneesScolarite } from './donnees-scolarite'
import { donneesAcademique } from './donnees-academique'

import { routesAdministration } from './routes-administration'
import { routesScolarite } from './routes-scolarite'
import { routesAcademique } from './routes-academique'

export function installerSimulation() {
  initialiserBase({
    ...donneesAdministration(),
    ...donneesScolarite(),
    ...donneesAcademique(),
  })

  const simulateur = new MockAdapter(api, { delayResponse: 300 })

  routesAdministration(simulateur)
  routesScolarite(simulateur)
  routesAcademique(simulateur)

  // Toute route non declaree remonte une 404 explicite plutot qu'un silence.
  simulateur.onAny().reply(404, { message: "Cette route n'est pas encore simulee." })
}

export type { default as Simulateur } from 'axios-mock-adapter'
