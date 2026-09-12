/** Assemblage du menu · PROPRIETAIRE : Boris · FIGE */
import { menuAdministration } from './menu-administration'
import { menuScolarite } from './menu-scolarite'
import { menuAcademique } from './menu-academique'
import type { GroupeMenu } from './types'

export const MENU: GroupeMenu[] = [...menuAdministration, ...menuScolarite, ...menuAcademique]
export type { EntreeMenu, GroupeMenu } from './types'
