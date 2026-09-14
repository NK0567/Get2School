/**
 * Export de listes · PROPRIETAIRE : Boris
 *
 * Les documents mis en page passent par GabaritDocument. Cette fonction sert
 * uniquement à l'export brut d'un tableau vers un tableur.
 */

export interface ColonneExport<T> {
  entete: string
  valeur: (ligne: T) => string | number | null | undefined
}

/**
 * Généré un fichier ouvrable directement dans Excel français :
 * séparateur point-virgule et BOM UTF-8, sans quoi les accents sont casses.
 */
export function exporterCsv<T>(nomFichier: string, colonnes: ColonneExport<T>[], lignes: T[]) {
  const echapper = (valeur: unknown) => {
    const texte = valeur === null || valeur === undefined ? '' : String(valeur)
    return /[";\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte
  }

  const contenu = [
    colonnes.map((c) => echapper(c.entete)).join(';'),
    ...lignes.map((ligne) => colonnes.map((c) => echapper(c.valeur(ligne))).join(';')),
  ].join('\r\n')

  const blob = new Blob(['\uFEFF' + contenu], { type: 'text/csv;charset=utf-8;' })
  const lien = document.createElement('a')
  lien.href = URL.createObjectURL(blob)
  lien.download = nomFichier.endsWith('.csv') ? nomFichier : `${nomFichier}.csv`
  lien.click()
  URL.revokeObjectURL(lien.href)
}

/** Horodatage pour les noms de fichiers : élèves-2026-09-14.csv */
export function nomFichierDate(base: string) {
  return `${base}-${new Date().toISOString().slice(0, 10)}`
}
