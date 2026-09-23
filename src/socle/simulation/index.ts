/**
 * Installation de la simulation · PROPRIETAIRE : Boris · FIGE
 *
 * Ce fichier n'évolue que si un lot est ajouté ou retiré, ou si le
 * mécanisme de résolution de l'établissement courant doit changer.
 * Chaque lot continue d'écrire uniquement ses deux fichiers :
 * données-<lot>.ts et routes-<lot>.ts, sans jamais se soucier du
 * cloisonnement — c'est fait une seule fois, ici.
 */
import MockAdapter from 'axios-mock-adapter'
import { api } from '../api/client'
import { definirEtablissementCourant, initialiserBase } from './base'
import type { GraineEtablissement } from './base'
import type { Utilisateur } from '../modeles/administration'

import { donneesAdministration } from './donnees-administration'
import { donneesScolarite } from './donnees-scolarite'
import { donneesAcademique } from './donnees-academique'
import {
  ETB2,
  donneesSecondaireParEtablissement,
  etablissementsSecondaireGlobaux,
} from './donnees-etablissement-secondaire'

import { routesAdministration } from './routes-administration'
import { routesScolarite } from './routes-scolarite'
import { routesAcademique } from './routes-academique'

const ETB1 = 'etb-1'

/**
 * Résout l'établissement du jeton porté par une requête, en cherchant
 * directement dans les données déjà persistées (localStorage) : à ce stade
 * `initialiserBase` n'a pas encore tourné pour cette requête-ci, mais elle a
 * nécessairement tourné une première fois au démarrage de l'application, donc
 * la base est déjà là.
 */
function etablissementDuJeton(config: { headers?: unknown }): string | null {
  const entetes = (config.headers ?? {}) as Record<string, string>
  const jeton = String(entetes.Authorization ?? '').replace('Bearer ', '')
  if (!jeton.startsWith('demo.')) return null
  const userId = jeton.slice(5)

  try {
    const brut = localStorage.getItem('g2s_base')
    if (!brut) return null
    const base = JSON.parse(brut) as Record<string, Record<string, unknown[]>>
    const utilisateurs = (base.__global__?.utilisateurs ?? []) as Utilisateur[]
    return utilisateurs.find((u) => u.id === userId)?.establishmentId ?? null
  } catch {
    return null
  }
}

/**
 * Entoure chaque gestionnaire de route (`s.onGet(...).reply(fn)`) pour
 * poser l'établissement courant avant de l'exécuter, et le nettoyer après.
 * C'est ce qui permet à `collection()`, dans base.ts, de savoir dans
 * quelle partition lire et écrire, sans qu'aucun fichier de routes n'ait à
 * s'en soucier ni à le répéter.
 */
function envelopperAdapter(adaptateur: MockAdapter): MockAdapter {
  const methodesInterceptees = ['onGet', 'onPost', 'onPut', 'onPatch', 'onDelete'] as const

  return new Proxy(adaptateur, {
    get(cible, propriete, recepteur) {
      const original = Reflect.get(cible, propriete, recepteur)
      if (
        typeof propriete !== 'string' ||
        !methodesInterceptees.includes(propriete as (typeof methodesInterceptees)[number])
      ) {
        return original
      }

      return (...arguments_: unknown[]) => {
        const constructeur = (original as (...a: unknown[]) => { reply: (arg: unknown) => unknown }).apply(
          cible,
          arguments_,
        )
        const repondreOriginal = constructeur.reply.bind(constructeur)

        constructeur.reply = (argument: unknown) => {
          // .reply(204) ou .reply(200, {...}) : rien à envelopper, aucune
          // route du projet n'utilise cette forme pour une donnée qui
          // dépendrait de l'établissement.
          if (typeof argument !== 'function') return repondreOriginal(argument)

          const gestionnaire = argument as (config: unknown) => unknown
          return repondreOriginal((config: { headers?: unknown }) => {
            definirEtablissementCourant(etablissementDuJeton(config))
            try {
              return gestionnaire(config)
            } finally {
              definirEtablissementCourant(null)
            }
          })
        }

        return constructeur
      }
    },
  })
}

export function installerSimulation() {
  const {
    etablissements: etablissements1,
    utilisateurs: utilisateurs1,
    ...donnees1Admin
  } = donneesAdministration()
  const globaux2 = etablissementsSecondaireGlobaux()

  initialiserBase(
    {
      etablissements: [...etablissements1, ...globaux2.etablissements],
      utilisateurs: [...utilisateurs1, ...globaux2.utilisateurs],
    },
    [
      {
        establishmentId: ETB1,
        donnees: { ...donnees1Admin, ...donneesScolarite(), ...donneesAcademique() },
      } satisfies GraineEtablissement,
      {
        establishmentId: ETB2,
        donnees: donneesSecondaireParEtablissement(),
      } satisfies GraineEtablissement,
    ],
  )

  const simulateur = envelopperAdapter(new MockAdapter(api, { delayResponse: 300 }))

  routesAdministration(simulateur)
  routesScolarite(simulateur)
  routesAcademique(simulateur)

  // Toute route non déclarée remonte une 404 explicite plutot qu'un silence.
  simulateur.onAny().reply(404, { message: "Cette route n'est pas encore simulee." })
}

export type { default as Simulateur } from 'axios-mock-adapter'
