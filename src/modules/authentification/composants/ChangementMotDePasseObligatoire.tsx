/**
 * Changement de mot de passe obligatoire · lot A (Boris)
 *
 * Affiché à la place de toute l'application tant que mustChangePassword
 * est vrai sur le compte connecté — jamais un simple rappel qu'on peut
 * ignorer. Un mot de passe par défaut, communiqué à la création du compte,
 * n'est jamais une autorisation d'usage normal.
 */
import { useState } from 'react'
import { Bouton, Champ, useToast } from '../../../ui'
import { JaugeMotDePasse, evaluerMotDePasse } from '../../../communs'
import { useSession } from '../../../socle/etat/useSession'
import { changerMotDePasse } from '../api'

export function ChangementMotDePasseObligatoire() {
  const toast = useToast()
  const utilisateur = useSession((e) => e.utilisateur)
  const marquerMotDePasseAJour = useSession((e) => e.marquerMotDePasseAJour)

  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  const contexte = { email: utilisateur?.email, nom: utilisateur?.lastName, prenom: utilisateur?.firstName }
  const evaluation = evaluerMotDePasse(nouveau, contexte)

  const valider = async () => {
    if (!evaluation.valide) {
      setErreur('Le mot de passe ne respecte pas encore toutes les exigences.')
      return
    }
    if (nouveau !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }
    setErreur('')
    setEnCours(true)
    try {
      await changerMotDePasse(ancien, nouveau)
      marquerMotDePasseAJour()
      toast('succes', 'Votre mot de passe a été mis à jour.')
    } catch (e) {
      setErreur((e as { message?: string })?.message ?? 'La modification a échoué.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="bg-canvas flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="border-line bg-surface rounded-xl border p-7">
          <h1 className="text-ink mb-1 text-base font-semibold">Choisissez votre mot de passe</h1>
          <p className="text-muted mb-5 text-sm">
            Ce compte a été créé avec un mot de passe temporaire. Choisissez-en un qui vous appartient avant
            de continuer.
          </p>

          <div className="flex flex-col gap-4">
            <Champ
              libelle="Mot de passe temporaire"
              requis
              type="password"
              autoComplete="current-password"
              value={ancien}
              onChange={(e) => setAncien(e.target.value)}
            />
            <Champ
              libelle="Nouveau mot de passe"
              requis
              type="password"
              autoComplete="new-password"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
            />
            <JaugeMotDePasse valeur={nouveau} contexte={contexte} />
            <Champ
              libelle="Confirmation"
              requis
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              erreur={erreur}
            />
            <Bouton chargement={enCours} onClick={valider} disabled={!ancien || !nouveau}>
              Continuer
            </Bouton>
          </div>
        </div>
      </div>
    </div>
  )
}
