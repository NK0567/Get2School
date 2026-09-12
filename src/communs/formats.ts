/**
 * Formatage commun aux trois lots · PROPRIETAIRE : Boris
 *
 * Personne ne reformate une date ou un montant a la main dans un ecran.
 * Un affichage different d'un module a l'autre se voit immediatement en
 * soutenance.
 */
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

/** 12/09/2026 */
export function formaterDate(valeur?: string | null) {
  if (!valeur) return '—'
  return format(parseISO(valeur), 'dd/MM/yyyy')
}

/** 12/09/2026 a 14:05 */
export function formaterDateHeure(valeur?: string | null) {
  if (!valeur) return '—'
  return format(parseISO(valeur), "dd/MM/yyyy 'a' HH:mm")
}

/** il y a 3 jours */
export function formaterDepuis(valeur?: string | null) {
  if (!valeur) return '—'
  return formatDistanceToNow(parseISO(valeur), { locale: fr, addSuffix: true })
}

/** 125 000 FCFA */
export function formaterMontant(valeur?: number | null, devise = 'FCFA') {
  if (valeur === null || valeur === undefined) return '—'
  return `${valeur.toLocaleString('fr-FR')} ${devise}`
}

/**
 * 14,25 · deux decimales, virgule francaise.
 * Une matiere non notee renvoie un tiret, jamais 0,00.
 */
export function formaterMoyenne(valeur?: number | null) {
  if (valeur === null || valeur === undefined) return '—'
  return valeur.toFixed(2).replace('.', ',')
}

/** 1er, 2e, 3e */
export function formaterRang(rang?: number | null, total?: number) {
  if (rang === null || rang === undefined) return '—'
  const suffixe = rang === 1 ? 'er' : 'e'
  return total ? `${rang}${suffixe} / ${total}` : `${rang}${suffixe}`
}

/** KAMGA Ariane · nom en majuscules, prenom en capitale initiale. */
export function formaterNomComplet(prenom?: string, nom?: string) {
  if (!prenom && !nom) return '—'
  return `${(nom ?? '').toUpperCase()} ${prenom ?? ''}`.trim()
}

/** AK · pour les pastilles d'avatar. */
export function initiales(prenom?: string, nom?: string) {
  return `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || '?'
}

/** 68 % */
export function formaterPourcentage(valeur?: number | null, decimales = 0) {
  if (valeur === null || valeur === undefined) return '—'
  return `${valeur.toFixed(decimales).replace('.', ',')} %`
}
