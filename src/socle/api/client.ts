/**
 * Instance axios unique · PROPRIÉTAIRE : Boris
 *
 * Tous les modules appellent l'API à travers cette instance, comme si le
 * backend Spring Boot existait déjà. En développement, la simulation
 * intercepte les requêtes. Le jour de la bascule, on retire l'appel à
 * installerSimulation() dans main.tsx et aucun composant ne change.
 */
import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

/** Ajoute le jeton à chaque requête. */
api.interceptors.request.use((config) => {
  const jeton = localStorage.getItem('g2s_jeton')
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`
  return config
})

export interface ErreurApi {
  statut: number
  message: string
}

/**
 * Gestionnaire d'expiration de session.
 *
 * Il est enregistré par l'application au démarrage plutôt qu'importé ici :
 * le store de session importe déjà ce fichier, un import inverse créerait un
 * cycle. C'est aussi ce qui permet de tester ce module isolément.
 */
type GestionnaireExpiration = () => void
let surExpiration: GestionnaireExpiration | null = null

export function definirGestionnaireExpiration(gestionnaire: GestionnaireExpiration) {
  surExpiration = gestionnaire
}

/** Normalise les erreurs : on ne manipule jamais d'objet axios dans un écran. */
api.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    const statut = erreur?.response?.status ?? 0

    // 401 sur une requête authentifiée : le jeton est expiré ou révoqué.
    // On ferme la session localement plutôt que de laisser l'utilisateur
    // enchaîner des écrans vides.
    const urlAuth = String(erreur?.config?.url ?? '').startsWith('/auth/')
    if (statut === 401 && !urlAuth) surExpiration?.()

    const message =
      erreur?.response?.data?.message ??
      (statut === 0 ? 'Le serveur est injoignable.' : 'Une erreur est survenue.')

    return Promise.reject({ statut, message } satisfies ErreurApi)
  },
)
