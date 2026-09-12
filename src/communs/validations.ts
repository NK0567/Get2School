/**
 * Schemas de validation reutilisables · PROPRIETAIRE : Boris
 *
 * Les messages sont en francais et definitifs : ils s'affichent tels quels
 * sous les champs. Ne les reecrivez pas module par module.
 */
import { z } from 'zod'

export const texteRequis = (libelle: string, min = 2) => z.string().min(min, `${libelle} est obligatoire.`)

export const emailValide = z.string().email('Adresse electronique invalide.')

/** Numero camerounais : +237 suivi de 9 chiffres, espaces tolerees. */
export const telephoneValide = z
  .string()
  .regex(/^(\+237)?[\s.-]?[26]\d{2}([\s.-]?\d{2}){3}$/, 'Numero de telephone invalide.')

export const telephoneFacultatif = z.union([telephoneValide, z.literal('')]).optional()

/** Note comprise entre 0 et le bareme de l'evaluation (RG-06). */
export const noteValide = (bareme: number) =>
  z
    .number({ message: 'Saisissez une note.' })
    .min(0, 'La note ne peut pas etre negative.')
    .max(bareme, `La note ne peut pas depasser ${bareme}.`)

/** Montant strictement positif. */
export const montantValide = z
  .number({ message: 'Saisissez un montant.' })
  .positive('Le montant doit etre superieur a zero.')

/** Motif obligatoire : sanction de note, annulation de paiement, deverrouillage. */
export const motifRequis = z.string().min(5, 'Le motif est obligatoire et doit etre explicite.')

export const dateValide = z.string().min(1, 'La date est obligatoire.')
