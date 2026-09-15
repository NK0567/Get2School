import { useState } from 'react'
import { Ban, CircleCheck, ShieldCheck } from 'lucide-react'
import { useParams } from 'react-router'
import {
  Alerte,
  Bouton,
  CaseACocher,
  DialogueConfirmation,
  Selecteur,
  Squelette,
  useToast,
} from '../../../ui'
import {
  BadgeStatut,
  GabaritFiche,
  GrilleInfos,
  LigneInfo,
  formaterDateHeure,
  formaterNomComplet,
} from '../../../communs'
import { LIBELLE_ROLE, ROLES } from '../../../socle/modeles/communs'
import type { Permission, Role } from '../../../socle/modeles/communs'
import { useSession } from '../../../socle/etat/useSession'
import { LIBELLE_ACTION } from '../../journal-audit/api'
import { GROUPES_PERMISSIONS } from '../permissions'
import {
  useActivite,
  useChangerPermissions,
  useChangerRole,
  useChangerStatut,
  useUtilisateur,
} from '../hooks/useUtilisateurs'

export default function FicheUtilisateur() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const moi = useSession((e) => e.utilisateur)

  const requete = useUtilisateur(id)
  const activite = useActivite(id)
  const changerStatut = useChangerStatut()
  const changerRole = useChangerRole()
  const changerPermissions = useChangerPermissions()

  const [brouillonPermissions, setBrouillonPermissions] = useState<Permission[] | null>(null)
  const [confirmation, setConfirmation] = useState(false)

  if (requete.isLoading) return <Squelette className="h-96" />
  if (!requete.data) return null

  const utilisateur = requete.data
  const soiMeme = utilisateur.id === moi?.id
  const permissions = brouillonPermissions ?? utilisateur.permissions
  const modifie = brouillonPermissions !== null

  const basculer = (code: Permission) =>
    setBrouillonPermissions(
      permissions.includes(code) ? permissions.filter((p) => p !== code) : [...permissions, code],
    )

  return (
    <>
      <GabaritFiche
        titre={formaterNomComplet(utilisateur.firstName, utilisateur.lastName)}
        sousTitre={utilisateur.email}
        filAriane={['Administration', 'Utilisateurs']}
        retour="/utilisateurs"
        badges={<BadgeStatut valeur={utilisateur.isActive ? 'ACTIF' : 'INACTIF'} />}
        actions={
          <Bouton
            variante={utilisateur.isActive ? 'danger' : 'secondaire'}
            icone={utilisateur.isActive ? <Ban className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />}
            disabled={soiMeme}
            title={soiMeme ? 'Vous ne pouvez pas désactiver votre propre compte' : undefined}
            onClick={() => {
              if (utilisateur.isActive) setConfirmation(true)
              else void changerStatut.mutateAsync({ utilisateur, actif: true })
            }}
          >
            {utilisateur.isActive ? 'Désactiver' : 'Réactiver'}
          </Bouton>
        }
        onglets={[
          {
            cle: 'identite',
            libelle: 'Identité',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                <GrilleInfos colonnes={3}>
                  <LigneInfo libelle="Prénom">{utilisateur.firstName}</LigneInfo>
                  <LigneInfo libelle="Nom">{utilisateur.lastName}</LigneInfo>
                  <LigneInfo libelle="Adresse électronique">{utilisateur.email}</LigneInfo>
                  <LigneInfo libelle="Téléphone">{utilisateur.phone}</LigneInfo>
                  <LigneInfo libelle="Compte créé le">{formaterDateHeure(utilisateur.createdAt)}</LigneInfo>
                  <LigneInfo libelle="Dernière connexion">
                    {utilisateur.lastLoginAt ? formaterDateHeure(utilisateur.lastLoginAt) : 'Jamais'}
                  </LigneInfo>
                </GrilleInfos>

                <div className="border-line mt-5 max-w-sm border-t pt-4">
                  <Selecteur
                    libelle="Rôle"
                    value={utilisateur.role}
                    disabled={soiMeme}
                    onChange={async (e) => {
                      await changerRole.mutateAsync({ utilisateur, role: e.target.value as Role })
                      toast('succes', 'Le rôle a été modifié.')
                    }}
                    options={ROLES.filter((r) => r !== 'PLATFORM_ADMIN').map((r) => ({
                      valeur: r,
                      libelle: LIBELLE_ROLE[r],
                    }))}
                  />
                  {soiMeme && (
                    <p className="text-muted mt-2 text-xs">
                      Vous ne pouvez modifier ni votre propre rôle ni votre propre statut : cela permettrait
                      de se retirer l'accès sans recours.
                    </p>
                  )}
                </div>
              </div>
            ),
          },
          {
            cle: 'permissions',
            libelle: 'Permissions',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                {utilisateur.role === 'SCHOOL_ADMIN' ? (
                  <Alerte ton="info" titre="Super Administrateur">
                    Ce rôle détient toutes les permissions en permanence. Elles ne peuvent pas lui être
                    retirées.
                  </Alerte>
                ) : (
                  <>
                    <p className="text-muted mb-4 text-[13px]">
                      Ces permissions s'ajoutent à celles du rôle{' '}
                      <span className="text-ink font-medium">{LIBELLE_ROLE[utilisateur.role]}</span>. Elles
                      n'en retirent aucune.
                    </p>

                    <div className="flex flex-col gap-5">
                      {GROUPES_PERMISSIONS.map((groupe) => (
                        <div key={groupe.titre}>
                          <h3 className="text-muted mb-2 text-[11px] font-semibold tracking-wider uppercase">
                            {groupe.titre}
                          </h3>
                          <div className="flex flex-col gap-2">
                            {groupe.permissions.map((permission) => (
                              <div key={permission.code} className="flex items-start gap-2.5">
                                <CaseACocher
                                  checked={permissions.includes(permission.code)}
                                  onChange={() => basculer(permission.code)}
                                  className="mt-0.5"
                                />
                                <div>
                                  <div className="text-ink text-sm">{permission.libelle}</div>
                                  <div className="text-muted text-xs">{permission.description}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-line mt-5 flex justify-end gap-2 border-t pt-4">
                      <Bouton
                        variante="secondaire"
                        disabled={!modifie}
                        onClick={() => setBrouillonPermissions(null)}
                      >
                        Annuler
                      </Bouton>
                      <Bouton
                        icone={<ShieldCheck className="h-4 w-4" />}
                        disabled={!modifie}
                        chargement={changerPermissions.isPending}
                        onClick={async () => {
                          await changerPermissions.mutateAsync({ utilisateur, permissions })
                          setBrouillonPermissions(null)
                          toast('succes', 'Les permissions ont été enregistrées.')
                        }}
                      >
                        Enregistrer
                      </Bouton>
                    </div>
                  </>
                )}
              </div>
            ),
          },
          {
            cle: 'activite',
            libelle: 'Activité',
            contenu: (
              <div className="border-line bg-surface rounded-xl border p-5">
                {activite.isLoading && <Squelette className="h-32" />}
                {activite.data && activite.data.contenu.length === 0 && (
                  <p className="text-muted text-[13px]">Aucune opération enregistrée pour ce compte.</p>
                )}
                <div className="divide-line flex flex-col divide-y">
                  {activite.data?.contenu.map((entree) => (
                    <div key={entree.id} className="flex items-baseline justify-between py-2.5">
                      <div className="text-[13px]">
                        <span className="text-ink font-medium">{LIBELLE_ACTION[entree.action]}</span>
                        <span className="text-muted"> · {entree.entityLabel}</span>
                      </div>
                      <span className="text-muted shrink-0 text-xs tabular-nums">
                        {formaterDateHeure(entree.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-muted mt-3 text-xs">
                  Extrait du journal d'audit, limité aux quinze dernières opérations.
                </p>
              </div>
            ),
          },
        ]}
      />

      <DialogueConfirmation
        ouverte={confirmation}
        onFermer={() => setConfirmation(false)}
        titre="Désactiver ce compte"
        message={`${formaterNomComplet(utilisateur.firstName, utilisateur.lastName)} ne pourra plus se connecter. Ses données et son historique sont conservés.`}
        libelleAction="Désactiver le compte"
        chargement={changerStatut.isPending}
        onConfirmer={async () => {
          await changerStatut.mutateAsync({ utilisateur, actif: false })
          toast('succes', 'Le compte a été désactivé.')
          setConfirmation(false)
        }}
      />
    </>
  )
}
