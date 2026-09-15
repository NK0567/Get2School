/**
 * Catalogue des permissions fines · lot A (Boris)
 *
 * Le rôle donne un socle de droits, la permission fine l'ajuste. Un
 * secrétaire peut recevoir DOCUMENT_GENERATE sans devenir administrateur.
 *
 * Côté Spring Boot, ces codes deviennent les valeurs de @PreAuthorize. La
 * matrice éditée ici n'est qu'une manière de les régler : la vérification a
 * lieu sur le serveur, à chaque appel.
 */
import type { Permission, Role } from '../../socle/modeles/communs'

export interface GroupePermissions {
  titre: string
  permissions: { code: Permission; libelle: string; description: string }[]
}

export const GROUPES_PERMISSIONS: GroupePermissions[] = [
  {
    titre: 'Scolarité',
    permissions: [
      {
        code: 'STUDENT_READ',
        libelle: 'Consulter les élèves',
        description: 'Ouvrir un dossier élève et la liste des inscrits',
      },
      {
        code: 'STUDENT_WRITE',
        libelle: 'Modifier les élèves',
        description: 'Créer et modifier un dossier, inscrire, transférer',
      },
      { code: 'STUDENT_ARCHIVE', libelle: 'Archiver un élève', description: "Clore la scolarité d'un élève" },
    ],
  },
  {
    titre: 'Académique',
    permissions: [
      {
        code: 'GRADE_READ',
        libelle: 'Consulter les notes',
        description: 'Voir les notes, moyennes et classements',
      },
      {
        code: 'GRADE_WRITE',
        libelle: 'Saisir les notes',
        description: 'Créer et modifier des notes sur une période ouverte',
      },
      {
        code: 'GRADE_UNLOCK',
        libelle: 'Déverrouiller une période',
        description: 'Rouvrir la saisie sur une période validée, avec motif',
      },
    ],
  },
  {
    titre: 'Finance',
    permissions: [
      {
        code: 'PAYMENT_READ',
        libelle: 'Consulter les paiements',
        description: 'Voir les encaissements et la solvabilité',
      },
      {
        code: 'PAYMENT_WRITE',
        libelle: 'Enregistrer un paiement',
        description: 'Encaisser et produire un reçu',
      },
      {
        code: 'PAYMENT_CANCEL',
        libelle: 'Annuler un paiement',
        description: 'Annuler un encaissement, avec motif',
      },
    ],
  },
  {
    titre: 'Administration',
    permissions: [
      {
        code: 'DOCUMENT_GENERATE',
        libelle: 'Générer des documents',
        description: 'Produire bulletins, certificats et listes',
      },
      {
        code: 'USER_MANAGE',
        libelle: 'Gérer les comptes',
        description: 'Créer des comptes et attribuer des rôles',
      },
      {
        code: 'SETTINGS_MANAGE',
        libelle: "Configurer l'établissement",
        description: 'Modifier les règles de calcul et les paramètres',
      },
      {
        code: 'AUDIT_READ',
        libelle: "Consulter le journal d'audit",
        description: 'Lire le registre des opérations sensibles',
      },
    ],
  },
]

export const TOUTES_PERMISSIONS: Permission[] = GROUPES_PERMISSIONS.flatMap((g) =>
  g.permissions.map((p) => p.code),
)

export function libellePermission(code: Permission) {
  for (const groupe of GROUPES_PERMISSIONS) {
    const trouvee = groupe.permissions.find((p) => p.code === code)
    if (trouvee) return trouvee.libelle
  }
  return code
}

/**
 * Le Super Administrateur détient toutes les permissions en permanence.
 * Lui en retirer une reviendrait à pouvoir se verrouiller hors de son propre
 * établissement sans recours.
 */
export const ROLES_MODIFIABLES: Role[] = ['ADMIN', 'ACADEMIC_HEAD', 'SECRETARY', 'ACCOUNTANT', 'TEACHER']
