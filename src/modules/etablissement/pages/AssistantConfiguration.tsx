/**
 * Assistant de configuration initiale · lot A (Boris)
 *
 * A la première connexion d'un Super Administrateur, l'établissement reste en
 * statut PENDING tant que ces quatre étapes ne sont pas terminees. C'est le
 * point d'entree du produit : tant qu'il n'a pas été franchi, aucune donnée
 * scolaire ne peut être saisie.
 */
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Alerte, Bouton, Champ, EnteteDePage, Selecteur, SqueletteTableau, useToast } from '../../../ui'
import { GrilleInfos, LigneInfo, formaterDate } from '../../../communs'
import { LIBELLE_ROLE } from '../../../socle/modeles/communs'
import { useSession } from '../../../socle/etat/useSession'
import type { ParametresEtablissement } from '../../../socle/modeles/administration'
import { useEtablissement, useTerminerConfiguration } from '../hooks/useEtablissement'
import { IndicateurEtapes } from '../composants/IndicateurEtapes'
import { ReglesCalcul } from '../composants/ReglesCalcul'

const ETAPES = ['Identite', 'Année scolaire', 'Règles de calcul', 'Vérification']

interface Identite {
  name: string
  acronym: string
  slogan: string
  address: string
  phone: string
  email: string
  website: string
}

export default function AssistantConfiguration() {
  const toast = useToast()
  const naviguer = useNavigate()
  const utilisateur = useSession((e) => e.utilisateur)
  const { data: etablissement, isLoading } = useEtablissement()
  const terminer = useTerminerConfiguration()

  const [etape, setEtape] = useState(0)
  const [identiteSaisie, setIdentiteSaisie] = useState<Identite | null>(null)
  const [academique, setAcademique] = useState({
    anneeLabel: '2026-2027',
    startDate: '2026-09-01',
    endDate: '2027-07-15',
    periodType: 'TRIMESTER' as 'TRIMESTER' | 'SEMESTER',
  })
  const [reglesSaisies, setReglesSaisies] = useState<ParametresEtablissement | null>(null)

  if (isLoading) return <SqueletteTableau lignes={5} />

  // État derive : on part des valeurs de l'établissement, le brouillon prend le
  // relais des la première saisie. Pas d'effet de synchronisation a maintenir.
  const identite = identiteSaisie ?? {
    name: etablissement?.name ?? '',
    acronym: etablissement?.acronym ?? '',
    slogan: etablissement?.slogan ?? '',
    address: etablissement?.address ?? '',
    phone: etablissement?.phone ?? '',
    email: etablissement?.email ?? '',
    website: etablissement?.website ?? '',
  }
  const setIdentite = setIdentiteSaisie

  const regles: ParametresEtablissement = reglesSaisies ??
    etablissement?.settings ?? {
      periodType: 'TRIMESTER',
      maxGrade: 20,
      passingGrade: 10,
      currency: 'FCFA',
      riskWeights: { average: 40, trend: 20, absence: 25, discipline: 15 },
    }
  const setRegles = setReglesSaisies

  const identiteComplete = Boolean(
    identite.name && identite.acronym && identite.address && identite.phone && identite.email,
  )
  const academiqueComplet = Boolean(academique.anneeLabel && academique.startDate && academique.endDate)
  const totalPoids = Object.values(regles.riskWeights).reduce((a, b) => a + b, 0)
  const reglesValides = regles.passingGrade <= regles.maxGrade && totalPoids === 100

  const peutAvancer = [identiteComplete, academiqueComplet, reglesValides, true][etape]

  const valider = async () => {
    try {
      await terminer.mutateAsync({
        identite,
        academique,
        regles: { ...regles, periodType: academique.periodType },
      })
      toast('succes', "L'établissement est configuré. Vous pouvez commencer à créer les comptes.")
      naviguer('/utilisateurs')
    } catch {
      toast('danger', 'La configuration à échoué.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <EnteteDePage
        titre="Configuration de l'établissement"
        sousTitre="Quatre étapes avant de pouvoir utiliser la plateforme."
      />

      <IndicateurEtapes etapes={ETAPES} courante={etape} />

      <div className="border-line bg-surface rounded-xl border p-6">
        {etape === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Champ
              libelle="Nom de l'établissement"
              requis
              className="col-span-2"
              value={identite.name}
              onChange={(e) => setIdentite({ ...identite, name: e.target.value })}
            />
            <Champ
              libelle="Sigle"
              requis
              aide="Utilisé dans les matricules et les références de documents"
              value={identite.acronym}
              onChange={(e) => setIdentite({ ...identite, acronym: e.target.value.toUpperCase() })}
            />
            <Champ
              libelle="Slogan"
              aide="Facultatif"
              value={identite.slogan}
              onChange={(e) => setIdentite({ ...identite, slogan: e.target.value })}
            />
            <Champ
              libelle="Adresse"
              requis
              className="col-span-2"
              value={identite.address}
              onChange={(e) => setIdentite({ ...identite, address: e.target.value })}
            />
            <Champ
              libelle="Téléphone"
              requis
              value={identite.phone}
              onChange={(e) => setIdentite({ ...identite, phone: e.target.value })}
            />
            <Champ
              libelle="Adresse électronique"
              requis
              type="email"
              value={identite.email}
              onChange={(e) => setIdentite({ ...identite, email: e.target.value })}
            />
          </div>
        )}

        {etape === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <Champ
              libelle="Libellé de l'année"
              requis
              aide="Format 2026-2027"
              value={academique.anneeLabel}
              onChange={(e) => setAcademique({ ...academique, anneeLabel: e.target.value })}
            />
            <Selecteur
              libelle="Découpage"
              requis
              value={academique.periodType}
              onChange={(e) =>
                setAcademique({ ...academique, periodType: e.target.value as 'TRIMESTER' | 'SEMESTER' })
              }
              options={[
                { valeur: 'TRIMESTER', libelle: '3 trimestres' },
                { valeur: 'SEMESTER', libelle: '2 semestres' },
              ]}
            />
            <Champ
              libelle="Début de l'année"
              requis
              type="date"
              value={academique.startDate}
              onChange={(e) => setAcademique({ ...academique, startDate: e.target.value })}
            />
            <Champ
              libelle="Fin de l'année"
              requis
              type="date"
              value={academique.endDate}
              onChange={(e) => setAcademique({ ...academique, endDate: e.target.value })}
            />
            <div className="col-span-2">
              <Alerte ton="alerte">
                Le nombre de périodes est figé à l'ouverture de l'année. Il ne pourra plus être modifié
                ensuite, car les notes et les bulletins y sont rattachés.
              </Alerte>
            </div>
          </div>
        )}

        {etape === 2 && <ReglesCalcul valeurs={regles} onChange={setRegles} />}

        {etape === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-ink mb-1 text-sm font-semibold">Établissement</h3>
              <GrilleInfos colonnes={3}>
                <LigneInfo libelle="Nom">{identite.name}</LigneInfo>
                <LigneInfo libelle="Sigle">{identite.acronym}</LigneInfo>
                <LigneInfo libelle="Téléphone">{identite.phone}</LigneInfo>
                <LigneInfo libelle="Adresse">{identite.address}</LigneInfo>
                <LigneInfo libelle="Adresse électronique">{identite.email}</LigneInfo>
              </GrilleInfos>
            </div>
            <div className="border-line border-t pt-4">
              <h3 className="text-ink mb-1 text-sm font-semibold">Année scolaire</h3>
              <GrilleInfos colonnes={3}>
                <LigneInfo libelle="Libellé">{academique.anneeLabel}</LigneInfo>
                <LigneInfo libelle="Début">{formaterDate(academique.startDate)}</LigneInfo>
                <LigneInfo libelle="Fin">{formaterDate(academique.endDate)}</LigneInfo>
                <LigneInfo libelle="Découpage">
                  {academique.periodType === 'TRIMESTER' ? '3 trimestres' : '2 semestres'}
                </LigneInfo>
              </GrilleInfos>
            </div>
            <div className="border-line border-t pt-4">
              <h3 className="text-ink mb-1 text-sm font-semibold">Règles de calcul</h3>
              <GrilleInfos colonnes={3}>
                <LigneInfo libelle="Barème">{regles.maxGrade}</LigneInfo>
                <LigneInfo libelle="Moyenne de passage">{regles.passingGrade}</LigneInfo>
                <LigneInfo libelle="Devise">{regles.currency}</LigneInfo>
                <LigneInfo libelle="Note sanctionnée">Comptée zéro, coefficient inclus</LigneInfo>
              </GrilleInfos>
            </div>
            <div className="border-line border-t pt-4">
              <h3 className="text-ink mb-1 text-sm font-semibold">Compte principal</h3>
              <GrilleInfos colonnes={3}>
                <LigneInfo libelle="Titulaire">
                  {utilisateur?.firstName} {utilisateur?.lastName}
                </LigneInfo>
                <LigneInfo libelle="Rôle">{utilisateur ? LIBELLE_ROLE[utilisateur.role] : '—'}</LigneInfo>
                <LigneInfo libelle="Adresse">{utilisateur?.email}</LigneInfo>
              </GrilleInfos>
              <p className="text-muted mt-2 text-xs">
                Les autres comptes se creent ensuite depuis Administration puis Utilisateurs.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Bouton
          variante="secondaire"
          disabled={etape === 0}
          onClick={() => setEtape(etape - 1)}
          icone={<ArrowLeft className="h-4 w-4" />}
        >
          Precedent
        </Bouton>

        {etape < ETAPES.length - 1 ? (
          <Bouton disabled={!peutAvancer} onClick={() => setEtape(etape + 1)}>
            Continuer
            <ArrowRight className="h-4 w-4" />
          </Bouton>
        ) : (
          <Bouton chargement={terminer.isPending} onClick={valider} icone={<Check className="h-4 w-4" />}>
            Terminer la configuration
          </Bouton>
        )}
      </div>
    </div>
  )
}
