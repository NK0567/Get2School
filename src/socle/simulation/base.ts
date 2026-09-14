/**
 * Base de données simulee · PROPRIETAIRE : Boris
 *
 * Stockage en memoire, persiste dans localStorage. Chaque lot fournit ses
 * collections dans son propre fichier données-<lot>.ts : personne n'edite
 * un fichier commun, donc aucune fusion ne se croise ici.
 */

const CLE = 'g2s_base'

type Collections = Record<string, unknown[]>

let base: Collections = {}

export function initialiserBase(graine: Collections) {
  const enregistre = localStorage.getItem(CLE)
  if (enregistre) {
    try {
      base = JSON.parse(enregistre) as Collections
      // Une collection ajoutée depuis le dernier enregistrement doit apparaitre.
      for (const [nom, valeurs] of Object.entries(graine)) {
        if (!base[nom]) base[nom] = valeurs
      }
      return
    } catch {
      // base corrompue : on repart de la graine
    }
  }
  base = structuredClone(graine)
  persister()
}

function persister() {
  localStorage.setItem(CLE, JSON.stringify(base))
}

export function reinitialiserBase() {
  localStorage.removeItem(CLE)
  location.reload()
}

/** Accès type a une collection. */
export function collection<T>(nom: string): T[] {
  return (base[nom] ?? []) as T[]
}

export function remplacer<T>(nom: string, valeurs: T[]) {
  base[nom] = valeurs as unknown[]
  persister()
}

export function ajouter<T>(nom: string, valeur: T): T {
  base[nom] = [...(base[nom] ?? []), valeur]
  persister()
  return valeur
}

export function majParId<T extends { id: string }>(
  nom: string,
  id: string,
  modifs: Partial<T>,
): T | undefined {
  const liste = collection<T>(nom)
  const index = liste.findIndex((e) => e.id === id)
  if (index < 0) return undefined
  const fusion = { ...liste[index], ...modifs }
  liste[index] = fusion
  remplacer(nom, liste)
  return fusion
}

export function parId<T extends { id: string }>(nom: string, id: string): T | undefined {
  return collection<T>(nom).find((e) => e.id === id)
}

/** Pagination commune a toutes les listes simulees. */
export function paginer<T>(liste: T[], parametres: URLSearchParams) {
  const page = Number(parametres.get('page') ?? 0)
  const taille = Number(parametres.get('taille') ?? 20)
  const debut = page * taille
  return { contenu: liste.slice(debut, debut + taille), total: liste.length, page, taille }
}

/**
 * Extrait les paramètres d'une requête simulée.
 *
 * Axios place les paramètres passés via `{ params }` dans `config.params`, et
 * non dans l'URL. Lire uniquement l'URL laisse passer silencieusement tous les
 * filtres : on lit donc les deux sources.
 */
export function parametres(config: { url?: string; params?: unknown }): URLSearchParams {
  const resultat = new URLSearchParams((config.url ?? '').split('?')[1] ?? '')

  const params = config.params
  if (params && typeof params === 'object') {
    for (const [cle, valeur] of Object.entries(params as Record<string, unknown>)) {
      if (valeur === undefined || valeur === null || valeur === '') continue
      resultat.set(cle, String(valeur))
    }
  }
  return resultat
}
