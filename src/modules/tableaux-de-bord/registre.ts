/**
 * Registre des blocs de tableau de bord · PROPRIETAIRE : Boris · FIGE
 *
 * Chaque lot ecrit SON fichier de bloc. Ce registre associé simplement un
 * rôle a un bloc : personne n'edite le même fichier, donc aucune fusion ne
 * se croise sur le tableau de bord.
 */
import type { ComponentType } from 'react'
import type { Role } from '../../socle/modeles/communs'
import { TableauDeBordAdministration } from './administration'
import { TableauDeBordScolarite } from './scolarite'
import { TableauDeBordAcademique } from './academique'

export const BLOC_PAR_ROLE: Record<Role, ComponentType> = {
  PLATFORM_ADMIN: TableauDeBordAdministration,
  SCHOOL_ADMIN: TableauDeBordAdministration,
  ADMIN: TableauDeBordAdministration,
  SECRETARY: TableauDeBordScolarite,
  ACCOUNTANT: TableauDeBordScolarite,
  ACADEMIC_HEAD: TableauDeBordAcademique,
  TEACHER: TableauDeBordAcademique,
}
