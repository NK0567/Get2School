/**
 * Inscription d'un établissement · lot A (Boris)
 *
 * Point d'entrée du SaaS : un responsable qui n'a encore aucun compte
 * arrive ici, crée son établissement et devient automatiquement son
 * premier responsable (SCHOOL_ADMIN). La constitution du reste de l'équipe
 * — censeur, secrétaire, intendant, enseignants — se fait à l'étape
 * suivante, une fois connecté (module Équipe fondatrice).
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Alerte, Bouton, Champ, Selecteur, useToast } from '../../../ui'
import {
  GrilleInfos,
  JaugeMotDePasse,
  LigneInfo,
  emailValide,
  evaluerMotDePasse,
  telephoneValide,
  texteRequis,
} from '../../../communs'
import { useSession } from '../../../socle/etat/useSession'
import { IndicateurEtapes } from '../../etablissement/composants/IndicateurEtapes'
import {
  COULEUR_THEME,
  LIBELLE_CATEGORIE,
  LIBELLE_THEME,
  codeDisponible,
  inscrireEtablissement,
} from '../api'
import type { InscriptionEtablissement as Formulaire } from '../api'

const ETAPES = ['Établissement', 'Votre compte', 'Vérification']

const VALEURS_INITIALES: Formulaire = {
  name: '',
  category: 'SECONDARY',
  theme: 'BLEU',
  slogan: '',
  logoUrl: '',
  address: '',
  phone: '',
  email: '',
  directorFirstName: '',
  directorLastName: '',
  directorEmail: '',
  directorPassword: '',
}

export default function InscriptionEtablissement() {
  const toast = useToast()
  const naviguer = useNavigate()
  const connecterSession = useSession((e) => e.connecter)

  const [etape, setEtape] = useState(0)
  const [valeurs, setValeurs] = useState<Formulaire>(VALEURS_INITIALES)
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  const maj = (modifs: Partial<Formulaire>) => setValeurs((v) => ({ ...v, ...modifs }))

  const { data: verifCode } = useQuery({
    queryKey: ['code-disponible', valeurs.name],
    queryFn: () => codeDisponible(valeurs.name),
    enabled: valeurs.name.trim().length >= 3,
  })

  const validerEtape0 = () => {
    const e: Record<string, string> = {}
    if (!texteRequis('', 2).safeParse(valeurs.name).success)
      e.name = "Le nom de l'établissement est obligatoire."
    if (!texteRequis('', 5).safeParse(valeurs.address).success) e.address = "L'adresse est obligatoire."
    if (!telephoneValide.safeParse(valeurs.phone).success) e.phone = 'Numéro de téléphone invalide.'
    if (!emailValide.safeParse(valeurs.email).success) e.email = 'Adresse électronique invalide.'
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  const validerEtape1 = () => {
    const e: Record<string, string> = {}
    if (!texteRequis('', 1).safeParse(valeurs.directorFirstName).success)
      e.directorFirstName = 'Prénom obligatoire.'
    if (!texteRequis('', 1).safeParse(valeurs.directorLastName).success)
      e.directorLastName = 'Nom obligatoire.'
    if (!emailValide.safeParse(valeurs.directorEmail).success)
      e.directorEmail = 'Adresse électronique invalide.'
    const evaluation = evaluerMotDePasse(valeurs.directorPassword, {
      email: valeurs.directorEmail,
      nom: valeurs.directorLastName,
      prenom: valeurs.directorFirstName,
    })
    if (!evaluation.valide)
      e.directorPassword = 'Le mot de passe ne respecte pas encore toutes les exigences.'
    if (valeurs.directorPassword !== confirmationMotDePasse)
      e.confirmation = 'Les deux mots de passe ne correspondent pas.'
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  const suivant = () => {
    if (etape === 0 && !validerEtape0()) return
    if (etape === 1 && !validerEtape1()) return
    setErreurs({})
    setEtape((e) => Math.min(e + 1, ETAPES.length - 1))
  }
  const precedent = () => setEtape((e) => Math.max(e - 1, 0))

  const valider = async () => {
    setEnCours(true)
    try {
      const reponse = await inscrireEtablissement(valeurs)
      localStorage.setItem('g2s_jeton', reponse.jeton)
      // Le compte vient d'être créé par lui-même : la session doit refléter
      // l'établissement qui vient de naître, pas rejouer une connexion
      // classique par mot de passe.
      await connecterSession(valeurs.directorEmail, valeurs.directorPassword)
      toast('succes', `${reponse.etablissement.name} a été créé. Bienvenue !`)
      naviguer('/equipe-fondatrice', { replace: true })
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? "L'inscription a échoué.")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="bg-canvas flex min-h-screen items-start justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="text-ink mb-1 text-center text-2xl font-semibold">Get2School</div>
        <p className="text-muted mb-6 text-center text-sm">Créez l'espace de votre établissement</p>

        <div className="border-line bg-surface rounded-xl border p-7">
          <IndicateurEtapes etapes={ETAPES} courante={etape} />

          {etape === 0 && (
            <div className="flex flex-col gap-4">
              <Champ
                libelle="Nom de l'établissement"
                requis
                value={valeurs.name}
                onChange={(e) => maj({ name: e.target.value })}
                erreur={erreurs.name}
                placeholder="Collège Excellence de Yaoundé"
              />
              {verifCode && (
                <p className="text-muted -mt-2 text-xs">
                  Code établissement généré :{' '}
                  <span className="text-ink font-medium">{verifCode.codeSuggere}</span>
                  {!verifCode.disponible && ' (ajusté pour rester unique)'}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Selecteur
                    libelle="Catégorie"
                    requis
                    value={valeurs.category}
                    onChange={(e) => maj({ category: e.target.value as Formulaire['category'] })}
                    options={(Object.keys(LIBELLE_CATEGORIE) as Formulaire['category'][]).map((c) => ({
                      valeur: c,
                      libelle: LIBELLE_CATEGORIE[c],
                    }))}
                  />
                  <p className="text-muted mt-1 text-xs">Le supérieur n'est pas encore pris en charge</p>
                </div>
                <Selecteur
                  libelle="Thème"
                  requis
                  value={valeurs.theme}
                  onChange={(e) => maj({ theme: e.target.value as Formulaire['theme'] })}
                  options={(Object.keys(LIBELLE_THEME) as Formulaire['theme'][]).map((t) => ({
                    valeur: t,
                    libelle: LIBELLE_THEME[t],
                  }))}
                />
              </div>
              <div className="flex items-center gap-2">
                {(Object.keys(COULEUR_THEME) as Formulaire['theme'][]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => maj({ theme: t })}
                    title={LIBELLE_THEME[t]}
                    className="h-7 w-7 rounded-full ring-offset-2 transition"
                    style={{
                      backgroundColor: COULEUR_THEME[t],
                      outline: valeurs.theme === t ? `2px solid ${COULEUR_THEME[t]}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
                <span className="text-muted text-xs">Repris sur vos bulletins et certificats</span>
              </div>
              <Champ
                libelle="Slogan"
                value={valeurs.slogan}
                onChange={(e) => maj({ slogan: e.target.value })}
                aide="Facultatif"
              />
              <Champ
                libelle="Adresse"
                requis
                value={valeurs.address}
                onChange={(e) => maj({ address: e.target.value })}
                erreur={erreurs.address}
              />
              <div className="grid grid-cols-2 gap-4">
                <Champ
                  libelle="Téléphone"
                  requis
                  value={valeurs.phone}
                  onChange={(e) => maj({ phone: e.target.value })}
                  erreur={erreurs.phone}
                />
                <Champ
                  libelle="Adresse électronique de l'établissement"
                  requis
                  type="email"
                  value={valeurs.email}
                  onChange={(e) => maj({ email: e.target.value })}
                  erreur={erreurs.email}
                />
              </div>
            </div>
          )}

          {etape === 1 && (
            <div className="flex flex-col gap-4">
              <Alerte ton="info">
                Ce compte sera le vôtre, avec tous les droits sur l'établissement. Vous pourrez ensuite créer
                les comptes de votre équipe.
              </Alerte>
              <div className="grid grid-cols-2 gap-4">
                <Champ
                  libelle="Prénom"
                  requis
                  value={valeurs.directorFirstName}
                  onChange={(e) => maj({ directorFirstName: e.target.value })}
                  erreur={erreurs.directorFirstName}
                />
                <Champ
                  libelle="Nom"
                  requis
                  value={valeurs.directorLastName}
                  onChange={(e) => maj({ directorLastName: e.target.value })}
                  erreur={erreurs.directorLastName}
                />
              </div>
              <Champ
                libelle="Adresse électronique (votre identifiant)"
                requis
                type="email"
                autoComplete="username"
                value={valeurs.directorEmail}
                onChange={(e) => maj({ directorEmail: e.target.value })}
                erreur={erreurs.directorEmail}
              />
              <Champ
                libelle="Mot de passe"
                requis
                type="password"
                autoComplete="new-password"
                value={valeurs.directorPassword}
                onChange={(e) => maj({ directorPassword: e.target.value })}
              />
              <JaugeMotDePasse
                valeur={valeurs.directorPassword}
                contexte={{
                  email: valeurs.directorEmail,
                  nom: valeurs.directorLastName,
                  prenom: valeurs.directorFirstName,
                }}
              />
              <Champ
                libelle="Confirmation"
                requis
                type="password"
                autoComplete="new-password"
                value={confirmationMotDePasse}
                onChange={(e) => setConfirmationMotDePasse(e.target.value)}
                erreur={erreurs.directorPassword ?? erreurs.confirmation}
              />
            </div>
          )}

          {etape === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-ink mb-2 text-sm font-semibold">Établissement</h3>
                <GrilleInfos colonnes={2}>
                  <LigneInfo libelle="Nom">{valeurs.name}</LigneInfo>
                  <LigneInfo libelle="Catégorie">{LIBELLE_CATEGORIE[valeurs.category]}</LigneInfo>
                  <LigneInfo libelle="Thème">{LIBELLE_THEME[valeurs.theme]}</LigneInfo>
                  <LigneInfo libelle="Adresse">{valeurs.address}</LigneInfo>
                </GrilleInfos>
              </div>
              <div className="border-line border-t pt-4">
                <h3 className="text-ink mb-2 text-sm font-semibold">Votre compte</h3>
                <GrilleInfos colonnes={2}>
                  <LigneInfo libelle="Nom">
                    {valeurs.directorFirstName} {valeurs.directorLastName}
                  </LigneInfo>
                  <LigneInfo libelle="Adresse électronique">{valeurs.directorEmail}</LigneInfo>
                </GrilleInfos>
              </div>
              <Alerte ton="info">
                Un essai gratuit d'un trimestre démarre à la création. Vous choisirez un abonnement à son
                échéance.
              </Alerte>
            </div>
          )}

          <div className="mt-7 flex justify-between">
            <Bouton
              variante="secondaire"
              icone={<ArrowLeft className="h-4 w-4" />}
              disabled={etape === 0}
              onClick={precedent}
            >
              Précédent
            </Bouton>
            {etape < ETAPES.length - 1 ? (
              <Bouton icone={<ArrowRight className="h-4 w-4" />} onClick={suivant}>
                Suivant
              </Bouton>
            ) : (
              <Bouton icone={<Check className="h-4 w-4" />} chargement={enCours} onClick={valider}>
                Créer mon établissement
              </Bouton>
            )}
          </div>
        </div>

        <p className="text-muted mt-4 text-center text-[13px]">
          Déjà inscrit ?{' '}
          <Link to="/connexion" className="text-primary hover:underline">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  )
}
