/**
 * Instance axios unique · PROPRIETAIRE : Boris
 *
 * Tous les modules appellent l'API a travers cette instance, comme si le
 * backend Spring Boot existait deja. En developpement, la simulation
 * intercepte les requetes. Le jour de la bascule, on met VITE_API_SIMULEE
 * a "false" et aucun composant ne change.
 */
import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

/** Ajoute le jeton et le contexte d'etablissement a chaque requete. */
api.interceptors.request.use((config) => {
  const jeton = localStorage.getItem('g2s_jeton')
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`
  return config
})

/** Normalise les erreurs : on ne manipule jamais d'objet axios dans un ecran. */
export interface ErreurApi {
  statut: number
  message: string
}

api.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    const statut = erreur?.response?.status ?? 0
    const message =
      erreur?.response?.data?.message ??
      (statut === 0 ? 'Le serveur est injoignable.' : 'Une erreur est survenue.')
    return Promise.reject({ statut, message } satisfies ErreurApi)
  },
)
