import { useState } from 'react'
import { Check, ShieldCheck } from 'lucide-react'
import { Alerte, Bouton, EnteteDePage, Squelette, cn, useToast } from '../../../ui'
import { LIBELLE_ROLE } from '../../../socle/modeles/communs'
import type { Permission, Role } from '../../../socle/modeles/communs'
import { GROUPES_PERMISSIONS, ROLES_MODIFIABLES, TOUTES_PERMISSIONS } from '../permissions'
import type { MatriceRoles } from '../api'
import { useEnregistrerMatrice, useMatriceRoles } from '../hooks/useUtilisateurs'

/**
 * Socle de permissions par rôle. Un compte peut recevoir des permissions
 * supplémentaires sur sa fiche, jamais en perdre : retirer ici un droit du
 * rôle le retire à tous les comptes qui le portent.
 */
export default function MatricePermissions() {
  const toast = useToast()
  const requete = useMatriceRoles()
  const enregistrer = useEnregistrerMatrice()
  const [brouillon, setBrouillon] = useState<MatriceRoles | null>(null)

  if (requete.isLoading) return <Squelette className="h-96" />
  if (!requete.data) return null

  const matrice = brouillon ?? requete.data
  const modifie = brouillon !== null

  const detient = (role: Role, code: Permission) =>
    role === 'SCHOOL_ADMIN' || (matrice[role] ?? []).includes(code)

  const basculer = (role: Role, code: Permission) => {
    const actuelles = matrice[role] ?? []
    setBrouillon({
      ...matrice,
      [role]: actuelles.includes(code) ? actuelles.filter((p) => p !== code) : [...actuelles, code],
    })
  }

  const colonnes: Role[] = ['SCHOOL_ADMIN', ...ROLES_MODIFIABLES]

  return (
    <>
      <EnteteDePage
        titre="Rôles et permissions"
        sousTitre="Socle de droits attribué à chaque rôle de l'établissement."
        filAriane={['Administration', 'Utilisateurs']}
        actions={
          <>
            <Bouton variante="secondaire" disabled={!modifie} onClick={() => setBrouillon(null)}>
              Annuler
            </Bouton>
            <Bouton
              icone={<ShieldCheck className="h-4 w-4" />}
              disabled={!modifie}
              chargement={enregistrer.isPending}
              onClick={async () => {
                await enregistrer.mutateAsync({ avant: requete.data, matrice })
                setBrouillon(null)
                toast('succes', 'La matrice a été enregistrée.')
              }}
            >
              Enregistrer
            </Bouton>
          </>
        }
      />

      <Alerte ton="alerte">
        Retirer un droit à un rôle le retire à tous les comptes qui le portent, immédiatement. Le Super
        Administrateur conserve toutes les permissions en permanence : sans cela, il serait possible de se
        verrouiller hors de son propre établissement sans recours.
      </Alerte>

      <div className="border-line bg-surface overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-line bg-canvas border-b">
              <th className="text-muted px-4 py-2.5 text-left text-[12px] font-semibold">Permission</th>
              {colonnes.map((role) => (
                <th key={role} className="text-muted px-3 py-2.5 text-center text-[11px] font-semibold">
                  {LIBELLE_ROLE[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPES_PERMISSIONS.map((groupe) => (
              <>
                <tr key={groupe.titre} className="border-line bg-canvas/60 border-b">
                  <td
                    colSpan={colonnes.length + 1}
                    className="text-muted px-4 py-1.5 text-[11px] font-semibold tracking-wider uppercase"
                  >
                    {groupe.titre}
                  </td>
                </tr>
                {groupe.permissions.map((permission) => (
                  <tr key={permission.code} className="border-line border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="text-ink">{permission.libelle}</div>
                      <div className="text-muted text-xs">{permission.description}</div>
                    </td>
                    {colonnes.map((role) => {
                      const fige = role === 'SCHOOL_ADMIN'
                      const actif = detient(role, permission.code)
                      return (
                        <td key={role} className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            disabled={fige}
                            onClick={() => basculer(role, permission.code)}
                            title={
                              fige ? 'Le Super Administrateur détient toutes les permissions' : undefined
                            }
                            className={cn(
                              'inline-flex h-6 w-6 items-center justify-center rounded border transition',
                              actif
                                ? 'border-primary bg-primary text-white'
                                : 'border-line bg-surface hover:border-primary/40',
                              fige && 'cursor-not-allowed opacity-60',
                            )}
                            aria-label={`${permission.libelle} pour ${LIBELLE_ROLE[role]}`}
                          >
                            {actif && <Check className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted mt-3 text-xs">
        {TOUTES_PERMISSIONS.length} permissions réparties sur {colonnes.length} rôles. Ces réglages sont
        appliqués par le serveur à chaque appel, et non seulement dans l'interface.
      </p>
    </>
  )
}
