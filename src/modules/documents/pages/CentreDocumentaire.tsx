import { useState } from 'react'
import { Ban, FileStack, FilePlus, Layers } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Bouton, MenuActions, Modale, Selecteur, ZoneTexte, useToast } from '../../../ui'
import type { ActionMenu, Colonne } from '../../../ui'
import { BadgeStatut, GabaritListe, formaterDateHeure, usePagination } from '../../../communs'
import type { DocumentGenere } from '../../../socle/modeles/administration'
import { CATEGORIES, TYPES_DOCUMENT, libelleType } from '../catalogue'
import { useAnnulerDocument, useDocuments } from '../hooks/useDocuments'
import { ModaleGeneration } from '../composants/ModaleGeneration'

export default function CentreDocumentaire() {
  const toast = useToast()
  const naviguer = useNavigate()
  const { page, taille, setPage, reinitialiser } = usePagination(15)

  const [type, setType] = useState('')
  const [statut, setStatut] = useState('')
  const [generationOuverte, setGenerationOuverte] = useState(false)
  const [aAnnuler, setAAnnuler] = useState<DocumentGenere | null>(null)
  const [motif, setMotif] = useState('')
  const [erreurMotif, setErreurMotif] = useState('')

  const requete = useDocuments({ type, statut, page, taille })
  const annuler = useAnnulerDocument()

  const actionsDe = (document: DocumentGenere): ActionMenu[] => [
    {
      libelle: 'Ouvrir le document',
      onClick: () => naviguer(`/documents/${document.id}/apercu`),
      desactiveeCar: document.status === 'CANCELLED' ? 'Ce document est annulé' : undefined,
    },
    {
      libelle: 'Vérifier la référence',
      onClick: () => window.open(`/v/${document.reference}`, '_blank'),
    },
    {
      libelle: 'Annuler le document',
      icone: <Ban className="h-4 w-4" />,
      destructif: true,
      onClick: () => setAAnnuler(document),
      desactiveeCar: document.status === 'CANCELLED' ? 'Déjà annulé' : undefined,
    },
  ]

  const colonnes: Colonne<DocumentGenere>[] = [
    {
      cle: 'reference',
      entete: 'Référence',
      rendu: (d) => <code className="text-[12px] tabular-nums">{d.reference}</code>,
    },
    { cle: 'type', entete: 'Type', rendu: (d) => libelleType(d.type) },
    { cle: 'cible', entete: 'Concerne', rendu: (d) => d.targetId },
    {
      cle: 'date',
      entete: 'Généré le',
      rendu: (d) => <span className="text-muted tabular-nums">{formaterDateHeure(d.generatedAt)}</span>,
    },
    { cle: 'statut', entete: 'Statut', rendu: (d) => <BadgeStatut valeur={d.status} /> },
    {
      cle: 'actions',
      entete: '',
      className: 'text-right',
      rendu: (d) => <MenuActions actions={actionsDe(d)} />,
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Centre documentaire"
        sousTitre="Générateur unique de la plateforme. Tous les documents officiels sont produits ici."
        filAriane={['Administration']}
        actions={
          <>
            <Bouton
              variante="secondaire"
              icone={<Layers className="h-4 w-4" />}
              onClick={() => naviguer('/documents/generation-lot')}
            >
              Génération en lot
            </Bouton>
            <Bouton icone={<FilePlus className="h-4 w-4" />} onClick={() => setGenerationOuverte(true)}>
              Générer un document
            </Bouton>
          </>
        }
        filtres={
          <>
            <Selecteur
              className="w-72"
              value={type}
              onChange={(e) => {
                setType(e.target.value)
                reinitialiser()
              }}
              placeholder="Tous les types"
              options={CATEGORIES.flatMap((categorie) =>
                TYPES_DOCUMENT.filter((t) => t.categorie === categorie).map((t) => ({
                  valeur: t.code,
                  libelle: `${categorie} · ${t.libelle}`,
                })),
              )}
            />
            <Selecteur
              value={statut}
              onChange={(e) => {
                setStatut(e.target.value)
                reinitialiser()
              }}
              placeholder="Tous les statuts"
              options={[
                { valeur: 'GENERATED', libelle: 'Généré' },
                { valeur: 'CANCELLED', libelle: 'Annulé' },
              ]}
            />
          </>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data?.contenu}
        colonnes={colonnes}
        cleLigne={(d) => d.id}
        onLigneCliquee={(d) => (d.status === 'CANCELLED' ? undefined : naviguer(`/documents/${d.id}/apercu`))}
        vide={{
          titre: 'Aucun document produit',
          description: 'Les documents générés depuis les autres modules apparaissent également ici.',
          icone: <FileStack className="h-8 w-8" />,
          action: <Bouton onClick={() => setGenerationOuverte(true)}>Générer un document</Bouton>,
        }}
        pagination={{ page, taille, total: requete.data?.total ?? 0, onChange: setPage }}
      />

      <ModaleGeneration ouverte={generationOuverte} onFermer={() => setGenerationOuverte(false)} />

      <Modale
        ouverte={aAnnuler !== null}
        onFermer={() => {
          setAAnnuler(null)
          setMotif('')
          setErreurMotif('')
        }}
        titre="Annuler ce document"
        taille="sm"
        pied={
          <>
            <Bouton variante="secondaire" onClick={() => setAAnnuler(null)}>
              Fermer
            </Bouton>
            <Bouton
              variante="danger"
              chargement={annuler.isPending}
              onClick={async () => {
                if (motif.trim().length < 5) {
                  setErreurMotif("Le motif d'annulation est obligatoire.")
                  return
                }
                if (!aAnnuler) return
                await annuler.mutateAsync({ document: aAnnuler, motif: motif.trim() })
                toast('succes', 'Le document a été annulé.')
                setAAnnuler(null)
                setMotif('')
                setErreurMotif('')
              }}
            >
              Annuler le document
            </Bouton>
          </>
        }
      >
        <p className="text-muted mb-3 text-sm">
          Le document conserve sa référence et reste dans les archives, mais sa page de vérification indiquera
          qu'il n'est plus valable. Un exemplaire déjà remis devient sans valeur.
        </p>
        <ZoneTexte
          libelle="Motif"
          requis
          rows={3}
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          erreur={erreurMotif}
          placeholder="Erreur sur la classe mentionnée"
        />
      </Modale>
    </>
  )
}
