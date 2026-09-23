/**
 * Base de données simulée · PROPRIETAIRE : Boris
 *
 * Stockage en mémoire, persiste dans localStorage. Chaque lot fournit ses
 * collections dans son propre fichier données-<lot>.ts : personne n'édite
 * un fichier commun, donc aucune fusion ne se croise ici.
 *
 * MULTI-ÉTABLISSEMENT (RG-01, RG-02) : la base est partitionnée par
 * établissement. Deux collections restent globales, parce qu'il faut
 * pouvoir les consulter AVANT de savoir à quel établissement on appartient :
 *
 *   - `etablissements` : le registre de tous les établissements inscrits.
 *   - `utilisateurs` : un compte est rattaché à un seul établissement, mais
 *     la connexion doit pouvoir retrouver ce compte par adresse électronique
 *     sans connaître l'établissement à l'avance — c'est justement ce que la
 *     connexion détermine.
 *
 * Tout le reste (élèves, classes, notes, paiements, documents, journal
 * d'audit...) vit dans la partition de SON établissement. Un responsable de
 * l'établissement A ne doit jamais pouvoir lire ni écrire une ligne de
 * l'établissement B, même par accident de requête mal filtrée : c'est
 * pourquoi le cloisonnement est fait ici, une seule fois, plutôt que
 * répété (et donc oubliable) dans chacune des centaines de routes
 * simulées des trois lots.
 *
 * L'établissement courant est résolu à partir du jeton de la requête, par
 * envelopperAdapter() dans index.ts, qui entoure chaque gestionnaire de
 * route : aucun fichier de routes n'a besoin de s'en soucier, il continue
 * d'appeler collection('eleves') exactement comme avant.
 */

const CLE = 'g2s_base'

type Collections = Record<string, unknown[]>

/** Ces deux collections ne sont jamais partitionnées : voir le commentaire d'en-tête. */
const COLLECTIONS_GLOBALES = new Set(['etablissements', 'utilisateurs'])

const PARTITION_GLOBALE = '__global__'

/** { [establishmentId]: { nomCollection: [...] } }, plus la partition __global__. */
let base: Record<string, Collections> = {}

/** Établissement de la requête en cours, posé par envelopperAdapter() avant chaque gestionnaire. */
let etablissementCourant: string | null = null

export function definirEtablissementCourant(id: string | null) {
  etablissementCourant = id
}

export function etablissementActuel(): string | null {
  return etablissementCourant
}

/**
 * L'établissement de la requête en cours, sous sa forme complète (nom,
 * paramètres...), pas seulement son identifiant. `etablissements` est une
 * collection globale — elle contient TOUS les établissements inscrits, pas
 * un seul — donc `collection('etablissements')[0]` ne désigne jamais « le »
 * bon établissement dès qu'un second tenant existe : c'est le piège exact
 * que le multi-établissement introduit, et cette fonction est le seul
 * endroit où il se résout, pour ne pas le laisser traîner dans chaque route.
 */
export function etablissementCourantDonnees<T extends { id: string }>(): T {
  const cle = etablissementCourant
  const tous = (partitionDe('etablissements')['etablissements'] ?? []) as T[]
  const trouve = cle ? tous.find((e) => e.id === cle) : undefined
  if (!trouve) {
    throw new Error('Aucun établissement résolu pour cette requête : jeton absent ou invalide.')
  }
  return trouve
}

/**
 * Graine de données pour UN établissement, indexée par son identifiant.
 * `initialiserBase` accepte un ou plusieurs établissements de démonstration :
 * c'est ce qui permet de vérifier réellement l'isolation entre deux
 * établissements, pas seulement de la déclarer dans un commentaire.
 */
export interface GraineEtablissement {
  establishmentId: string
  donnees: Collections
}

export function initialiserBase(etablissementsGlobaux: Collections, graines: GraineEtablissement[]) {
  const enregistre = localStorage.getItem(CLE)
  if (enregistre) {
    try {
      base = JSON.parse(enregistre) as Record<string, Collections>
      // Un établissement ou une collection ajoutés depuis le dernier
      // enregistrement doivent apparaître, sans écraser ce qui existe déjà.
      if (!base[PARTITION_GLOBALE]) base[PARTITION_GLOBALE] = {}
      for (const [nom, valeurs] of Object.entries(etablissementsGlobaux)) {
        if (!base[PARTITION_GLOBALE][nom]) base[PARTITION_GLOBALE][nom] = valeurs
      }
      for (const graine of graines) {
        if (!base[graine.establishmentId]) base[graine.establishmentId] = graine.donnees
        else {
          for (const [nom, valeurs] of Object.entries(graine.donnees)) {
            if (!base[graine.establishmentId][nom]) base[graine.establishmentId][nom] = valeurs
          }
        }
      }
      return
    } catch {
      // base corrompue : on repart de la graine
    }
  }
  base = structuredClone({
    [PARTITION_GLOBALE]: etablissementsGlobaux,
    ...Object.fromEntries(graines.map((g) => [g.establishmentId, g.donnees])),
  })
  persister()
}

function persister() {
  localStorage.setItem(CLE, JSON.stringify(base))
}

export function reinitialiserBase() {
  localStorage.removeItem(CLE)
  location.reload()
}

/** Partition à lire pour une collection donnée : globale, ou celle de l'établissement courant. */
function partitionDe(nomCollection: string): Collections {
  const cle = COLLECTIONS_GLOBALES.has(nomCollection) ? PARTITION_GLOBALE : etablissementCourant
  // Aucun établissement résolu (jeton absent ou invalide) : on renvoie un
  // panier vide plutôt que de planter — la route elle-même décide si
  // l'absence de données est une erreur (401/403) ou un cas normal.
  if (!cle) return {}
  if (!base[cle]) base[cle] = {}
  return base[cle]
}

/** Accès typé à une collection, dans la bonne partition. */
export function collection<T>(nom: string): T[] {
  return (partitionDe(nom)[nom] ?? []) as T[]
}

export function remplacer<T>(nom: string, valeurs: T[]) {
  partitionDe(nom)[nom] = valeurs as unknown[]
  persister()
}

export function ajouter<T>(nom: string, valeur: T): T {
  const partition = partitionDe(nom)
  partition[nom] = [...(partition[nom] ?? []), valeur]
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

/**
 * Recherche d'UNE collection à travers TOUS les établissements, avec
 * l'identifiant de l'établissement propriétaire de chaque ligne trouvée.
 *
 * Réservé aux quelques points de passage volontairement transversaux : la
 * vérification publique d'un document (accessible sans connexion, donc sans
 * établissement résolu — la référence scannée doit désigner l'établissement
 * elle-même) et la connexion, qui doit pouvoir situer un compte par adresse
 * électronique avant même de savoir où il vit. Utiliser cette fonction
 * ailleurs romprait le cloisonnement que le reste de ce fichier garantit.
 */
export function collectionToutesPartitions<T>(nom: string): { establishmentId: string; valeur: T }[] {
  const resultats: { establishmentId: string; valeur: T }[] = []
  for (const [cle, donnees] of Object.entries(base)) {
    if (cle === PARTITION_GLOBALE) continue
    for (const valeur of (donnees[nom] ?? []) as T[]) {
      resultats.push({ establishmentId: cle, valeur })
    }
  }
  return resultats
}

/**
 * Lit une collection dans la partition d'UN établissement précis, choisi
 * explicitement plutôt que déduit du jeton de la requête en cours.
 *
 * Sert exactement au même besoin transversal que collectionToutesPartitions,
 * une fois l'établissement déjà identifié (typiquement : après avoir trouvé
 * un document par sa référence publique, pour aller chercher le nom de son
 * titulaire DANS CET établissement précis, indépendamment de qui consulte
 * la page).
 */
export function collectionEtablissement<T>(establishmentId: string, nom: string): T[] {
  return ((base[establishmentId] ?? {})[nom] ?? []) as T[]
}

/**
 * Écrit dans la partition d'UN établissement précis, choisi explicitement.
 *
 * Réservé aux écritures qui doivent se faire AVANT qu'un établissement ne
 * soit résolu par le jeton — typiquement la trace d'audit d'une connexion
 * ou d'une déconnexion : à ce moment précis, l'établissement se déduit du
 * compte qu'on vient de retrouver, jamais du jeton, qui n'existe pas
 * encore (connexion) ou vient d'être invalidé (déconnexion).
 */
export function ajouterEtablissement<T>(establishmentId: string, nom: string, valeur: T): T {
  if (!base[establishmentId]) base[establishmentId] = {}
  base[establishmentId][nom] = [...(base[establishmentId][nom] ?? []), valeur]
  persister()
  return valeur
}

/** Pagination commune à toutes les listes simulées. */
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
