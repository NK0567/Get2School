import type { ComponentType } from 'react'
import type { Role } from '../../socle/modeles/communs'

export interface EntreeMenu {
  libelle: string
  chemin: string
  icone: ComponentType<{ className?: string }>
  roles: Role[]
}

export interface GroupeMenu {
  titre: string
  entrees: EntreeMenu[]
}
