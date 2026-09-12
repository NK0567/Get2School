import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Bouton, Champ, EnteteDePage, useToast } from '../../../ui'
import { GrilleInfos, LigneInfo, formaterDateHeure } from '../../../communs'
import { useSession } from '../../../socle/etat/useSession'
import { LIBELLE_ROLE } from '../../../socle/modeles/communs'

/** Ecran commun a tous les roles. */
export default function MonProfil() {
  const toast = useToast()
  const { utilisateur, roleActif } = useSession()

  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')

  const changer = () => {
    setErreur('')
    if (nouveau.length < 8) {
      setErreur('Le nouveau mot de passe doit contenir au moins 8 caracteres.')
      return
    }
    if (nouveau !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }
    setAncien('')
    setNouveau('')
    setConfirmation('')
    toast('succes', 'Votre mot de passe a ete modifie.')
  }

  return (
    <>
      <EnteteDePage titre="Mon profil" filAriane={['Mon compte']} />

      <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-1">
        <div className="border-line bg-surface col-span-2 rounded-xl border p-5">
          <h2 className="mb-2 text-base font-semibold">Informations</h2>
          <GrilleInfos colonnes={2}>
            <LigneInfo libelle="Prenom">{utilisateur?.firstName}</LigneInfo>
            <LigneInfo libelle="Nom">{utilisateur?.lastName}</LigneInfo>
            <LigneInfo libelle="Adresse electronique">{utilisateur?.email}</LigneInfo>
            <LigneInfo libelle="Telephone">{utilisateur?.phone}</LigneInfo>
            <LigneInfo libelle="Role">{roleActif ? LIBELLE_ROLE[roleActif] : '—'}</LigneInfo>
            <LigneInfo libelle="Derniere connexion">{formaterDateHeure(utilisateur?.lastLoginAt)}</LigneInfo>
          </GrilleInfos>
          <p className="text-muted mt-3 text-xs">
            Pour modifier ces informations, adressez-vous a l'administrateur de votre etablissement.
          </p>
        </div>

        <div className="border-line bg-surface rounded-xl border p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <KeyRound className="text-primary h-4 w-4" />
            Mot de passe
          </h2>
          <div className="flex flex-col gap-3">
            <Champ
              libelle="Mot de passe actuel"
              type="password"
              value={ancien}
              onChange={(e) => setAncien(e.target.value)}
            />
            <Champ
              libelle="Nouveau mot de passe"
              type="password"
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              aide="8 caracteres au minimum"
            />
            <Champ
              libelle="Confirmation"
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              erreur={erreur}
            />
            <Bouton onClick={changer} disabled={!ancien || !nouveau}>
              Modifier le mot de passe
            </Bouton>
          </div>
        </div>
      </div>
    </>
  )
}
