/**
 * Schemas de validation reutilisables · PROPRIETAIRE : Boris
 *
 * Les messages sont en français et définitifs : ils s'affichent tels quels
 * sous les champs. Ne les reecrivez pas module par module.
 */
import { z } from 'zod'

export const texteRequis = (libelle: string, min = 2) => z.string().min(min, `${libelle} est obligatoire.`)

export const emailValide = z.string().email('Adresse électronique invalide.')

/** Numéro camerounais : +237 suivi de 9 chiffres, espaces tolerees. */
export const telephoneValide = z
  .string()
  .regex(/^(\+237)?[\s.-]?[26]\d{2}([\s.-]?\d{2}){3}$/, 'Numéro de téléphone invalide.')

export const telephoneFacultatif = z.union([telephoneValide, z.literal('')]).optional()

/** Note comprise entre 0 et le barème de l'évaluation (RG-06). */
export const noteValide = (bareme: number) =>
  z
    .number({ message: 'Saisissez une note.' })
    .min(0, 'La note ne peut pas être negative.')
    .max(bareme, `La note ne peut pas depasser ${bareme}.`)

/** Montant strictement positif. */
export const montantValide = z
  .number({ message: 'Saisissez un montant.' })
  .positive('Le montant doit être supérieur à zéro.')

/** Motif obligatoire : sanction de note, annulation de paiement, déverrouillage. */
export const motifRequis = z.string().min(5, 'Le motif est obligatoire et doit être explicite.')

export const dateValide = z.string().min(1, 'La date est obligatoire.')
