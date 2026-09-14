import { useState } from 'react'
import { KeyRound, MonitorSmartphone } from 'lucide-react'
import { Bouton, Champ, EnteteDePage, useToast } from '../../../ui'
import {
  GrilleInfos,
  JaugeMotDePasse,
  LigneInfo,
  evaluerMotDePasse,
  formaterDateHeure,
} from '../../../communs'
import { useSession } from '../../../socle/etat/useSession'
import { LIBELLE_ROLE } from '../../../socle/modeles/communs'
import { changerMotDePasse } from '../../authentification/api'
import { SessionsActives } from '../../authentification/composants/SessionsActives'

export default function MonProfil() {
  const toast = useToast()
  const { utilisateur, roleActif } = useSession()

  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  const contexte = {
    email: utilisateur?.email,
    nom: utilisateur?.lastName,
    prenom: utilisateur?.firstName,
  }
  const evaluation = evaluerMotDePasse(nouveau, contexte)

  const changer = async () => {
    if (!evaluation.valide) {
      setErreur('Le mot de passe ne respecte pas encore toutes les exigences.')
      return
    }
    if (nouveau !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }
    if (nouveau === ancien) {
      setErreur("Le nouveau mot de passe doit différer de l'ancien.")
      return
    }
    setErreur('')
    setEnCours(true)
    try {
      await changerMotDePasse(ancien, nouveau)
      setAncien('')
      setNouveau('')
      setConfirmation('')
      toast('succes', 'Votre mot de passe a été modifié.')
    } catch (e) {
      setErreur((e as { message?: string })?.message ?? 'La modification a échoué.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <>
      <EnteteDePage titre="Mon profil" filAriane={['Mon compte']} />

      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <div className="col-span-2 flex flex-col gap-5">
          <div className="border-line bg-surface rounded-xl border p-5">
            <h2 className="mb-2 text-base font-semibold">Informations</h2>
            <GrilleInfos colonnes={2}>
              <LigneInfo libelle="Prénom">{utilisateur?.firstName}</LigneInfo>
              <LigneInfo libelle="Nom">{utilisateur?.lastName}</LigneInfo>
              <LigneInfo libelle="Adresse électronique">{utilisateur?.email}</LigneInfo>
              <LigneInfo libelle="Téléphone">{utilisateur?.phone}</LigneInfo>
              <LigneInfo libelle="Rôle">{roleActif ? LIBELLE_ROLE[roleActif] : '—'}</LigneInfo>
              <LigneInfo libelle="Dernière connexion">
                {formaterDateHeure(utilisateur?.lastLoginAt)}
              </LigneInfo>
            </GrilleInfos>
            <p className="text-muted mt-3 text-xs">
              Pour modifier ces informations, adressez-vous à l'administrateur de votre établissement.
            </p>
          </div>

          <div className="border-line bg-surface rounded-xl border p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <MonitorSmartphone className="text-primary h-4 w-4" />
              Sessions ouvertes
            </h2>
            <SessionsActives />
            <p className="text-muted mt-3 text-xs">
              Fermez une session que vous ne reconnaissez pas, puis changez votre mot de passe.
            </p>
          </div>
        </div>

        <div className="border-line bg-surface rounded-xl border p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <KeyRound className="text-primary h-4 w-4" />
            Mot de passe
          </h2>
          <div className="flex flex-col gap-3">
            <Champ
              libelle="Mot de passe actuel"
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
            <Bouton chargement={enCours} onClick={changer} disabled={!ancien || !nouveau}>
              Modifier le mot de passe
            </Bouton>
          </div>
        </div>
      </div>
    </>
  )
}
