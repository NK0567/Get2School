/**
 * Équipe fondatrice · lot A (Boris)
 *
 * Écran affiché une seule fois, juste après l'inscription d'un
 * établissement : le responsable constitue son équipe avant d'entrer dans
 * l'application. Chaque compte créé reçoit un mot de passe par défaut,
 * affiché une seule fois, avec obligation de le changer à la première
 * connexion (mustChangePassword, vérifié par RequiertMotDePasseActuel).
 *
 * Cet écran ne bloque rien : le responsable peut constituer son équipe
 * maintenant ou plus tard depuis le module Utilisateurs, identique en tout
 * point — ce n'est qu'un raccourci contextualisé au moment le plus
 * naturel pour le faire.
 */
import { useState } from 'react'
import { Check, Plus, UserCog } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Bouton, EnteteDePage } from '../../../ui'
import { LIBELLE_ROLE } from '../../../socle/modeles/communs'
import type { Role } from '../../../socle/modeles/communs'
import { useUtilisateurs } from '../../utilisateurs/hooks/useUtilisateurs'
import { ModaleNouvelUtilisateur } from '../../utilisateurs/composants/ModaleNouvelUtilisateur'

/** Postes usuels d'un établissement primaire ou secondaire, dans l'ordre où un responsable y pense. */
const POSTES_SUGGERES: Role[] = ['ACADEMIC_HEAD', 'SECRETARY', 'ACCOUNTANT', 'TEACHER']

export default function EquipeFondatrice() {
  const naviguer = useNavigate()
  const [creationOuverte, setCreationOuverte] = useState(false)

  const requete = useUtilisateurs({ taille: 50 })
  const membres = requete.data?.contenu ?? []
  const rolesDejaPresents = new Set(membres.map((u) => u.role))

  return (
    <div className="bg-canvas min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <EnteteDePage
          titre="Constituez votre équipe"
          sousTitre="Facultatif : vous pourrez ajouter ou modifier ces comptes à tout moment depuis Utilisateurs."
        />

        <div className="border-line bg-surface mb-5 rounded-xl border p-5">
          <h2 className="text-ink mb-3 text-sm font-semibold">Postes usuels</h2>
          <div className="flex flex-col gap-2">
            {POSTES_SUGGERES.map((role) => {
              const present = rolesDejaPresents.has(role)
              return (
                <div
                  key={role}
                  className="border-line flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2">
                    {present && <Check className="text-success h-4 w-4" />}
                    {LIBELLE_ROLE[role]}
                  </span>
                  {!present && (
                    <Bouton variante="fantome" taille="sm" onClick={() => setCreationOuverte(true)}>
                      Ajouter
                    </Bouton>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-line bg-surface mb-5 rounded-xl border p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-ink text-sm font-semibold">
              Comptes créés {membres.length > 0 && `(${membres.length})`}
            </h2>
            <Bouton
              variante="secondaire"
              taille="sm"
              icone={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setCreationOuverte(true)}
            >
              Nouveau compte
            </Bouton>
          </div>

          {membres.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <UserCog className="text-muted h-8 w-8" />
              <p className="text-muted text-[13px]">Aucun compte créé pour l'instant, en dehors du vôtre.</p>
            </div>
          ) : (
            <div className="divide-line flex flex-col divide-y">
              {membres.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 text-[13px]">
                  <span className="font-medium">
                    {u.firstName} {u.lastName}
                  </span>
                  <span className="text-muted">{LIBELLE_ROLE[u.role]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Bouton className="w-full" onClick={() => naviguer('/tableau-de-bord', { replace: true })}>
          Terminer et accéder au tableau de bord
        </Bouton>
      </div>

      <ModaleNouvelUtilisateur ouverte={creationOuverte} onFermer={() => setCreationOuverte(false)} />
    </div>
  )
}
