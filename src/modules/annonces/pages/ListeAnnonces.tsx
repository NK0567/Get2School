import { useState } from 'react'
import { Ban, Megaphone, Plus, Send } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Bouton, MenuActions, Modale, Selecteur, ZoneTexte, useToast } from '../../../ui'
import type { ActionMenu, Colonne } from '../../../ui'
import { BadgeStatut, GabaritListe, formaterDateHeure, usePagination } from '../../../communs'
import type { Annonce } from '../../../socle/modeles/administration'
import { LIBELLE_AUDIENCE, LIBELLE_PRIORITE } from '../api'
import { useAnnonces, usePublier, useRetirer } from '../hooks/useAnnonces'

const TON_PRIORITE: Record<Annonce['priority'], string> = {
  NORMAL: 'text-muted',
  HIGH: 'text-warning',
  URGENT: 'text-danger',
}

export default function ListeAnnonces() {
  const toast = useToast()
  const naviguer = useNavigate()
  const { page, taille, setPage, reinitialiser } = usePagination(15)

  const [statut, setStatut] = useState('')
  const [aRetirer, setARetirer] = useState<Annonce | null>(null)
  const [motif, setMotif] = useState('')
  const [erreurMotif, setErreurMotif] = useState('')

  const requete = useAnnonces({ statut, page, taille })
  const publier = usePublier()
  const retirer = useRetirer()

  const actionsDe = (annonce: Annonce): ActionMenu[] => [
    {
      libelle: 'Diffuser',
      icone: <Send className="h-4 w-4" />,
      onClick: async () => {
        await publier.mutateAsync(annonce.id)
        toast('succes', "L'annonce a été diffusée.")
      },
      desactiveeCar:
        annonce.status === 'PUBLISHED'
          ? 'Déjà diffusée'
          : annonce.status !== 'DRAFT'
            ? 'Cette annonce a été retirée'
            : undefined,
    },
    {
      libelle: "Retirer l'annonce",
      icone: <Ban className="h-4 w-4" />,
      destructif: true,
      onClick: () => setARetirer(annonce),
      desactiveeCar:
        annonce.status !== 'PUBLISHED' ? 'Seule une annonce diffusée peut être retirée' : undefined,
    },
  ]

  const colonnes: Colonne<Annonce>[] = [
    {
      cle: 'titre',
      entete: 'Annonce',
      rendu: (a) => (
        <div>
          <div className={`font-medium ${TON_PRIORITE[a.priority]}`}>{a.title}</div>
          <div className="text-muted line-clamp-1 text-xs">{a.body}</div>
        </div>
      ),
    },
    {
      cle: 'audience',
      entete: 'Destinataires',
      rendu: (a) => <span className="text-muted">{LIBELLE_AUDIENCE[a.audienceType]}</span>,
    },
    { cle: 'priorite', entete: 'Priorité', rendu: (a) => LIBELLE_PRIORITE[a.priority] },
    {
      cle: 'date',
      entete: 'Diffusée le',
      rendu: (a) => (
        <span className="text-muted tabular-nums">
          {a.publishedAt ? formaterDateHeure(a.publishedAt) : '—'}
        </span>
      ),
    },
    {
      cle: 'statut',
      entete: 'Statut',
      rendu: (a) => (
        <BadgeStatut
          valeur={a.status === 'PUBLISHED' ? 'PUBLISHED' : a.status === 'DRAFT' ? 'DRAFT' : 'CANCELLED'}
          libelle={a.status === 'PUBLISHED' ? 'Diffusée' : a.status === 'DRAFT' ? 'Brouillon' : 'Retirée'}
        />
      ),
    },
    {
      cle: 'actions',
      entete: '',
      className: 'text-right',
      rendu: (a) => <MenuActions actions={actionsDe(a)} />,
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Annonces"
        sousTitre="Communication institutionnelle vers le personnel de l'établissement."
        filAriane={['Administration']}
        actions={
          <Bouton
            icone={<Plus className="h-4 w-4" />}
            onClick={() => naviguer('/communication/annonces/nouvelle')}
          >
            Nouvelle annonce
          </Bouton>
        }
        filtres={
          <Selecteur
            value={statut}
            onChange={(e) => {
              setStatut(e.target.value)
              reinitialiser()
            }}
            placeholder="Tous les statuts"
            options={[
              { valeur: 'DRAFT', libelle: 'Brouillon' },
              { valeur: 'PUBLISHED', libelle: 'Diffusée' },
              { valeur: 'WITHDRAWN', libelle: 'Retirée' },
            ]}
          />
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data?.contenu}
        colonnes={colonnes}
        cleLigne={(a) => a.id}
        vide={{
          titre: 'Aucune annonce',
          description: 'Diffusez une information au personnel de votre établissement.',
          icone: <Megaphone className="h-8 w-8" />,
          action: (
            <Bouton onClick={() => naviguer('/communication/annonces/nouvelle')}>Nouvelle annonce</Bouton>
          ),
        }}
        pagination={{ page, taille, total: requete.data?.total ?? 0, onChange: setPage }}
      />

      <Modale
        ouverte={aRetirer !== null}
        onFermer={() => {
          setARetirer(null)
          setMotif('')
          setErreurMotif('')
        }}
        titre="Retirer cette annonce"
        taille="sm"
        pied={
          <>
            <Bouton variante="secondaire" onClick={() => setARetirer(null)}>
              Fermer
            </Bouton>
            <Bouton
              variante="danger"
              chargement={retirer.isPending}
              onClick={async () => {
                if (motif.trim().length < 5) {
                  setErreurMotif('Le motif du retrait est obligatoire.')
                  return
                }
                if (!aRetirer) return
                await retirer.mutateAsync({ annonce: aRetirer, motif: motif.trim() })
                toast('succes', "L'annonce a été retirée.")
                setARetirer(null)
                setMotif('')
                setErreurMotif('')
              }}
            >
              Retirer l'annonce
            </Bouton>
          </>
        }
      >
        <p className="text-muted mb-3 text-sm">
          L'annonce disparaîtra des notifications non lues. Les destinataires qui l'ont déjà consultée en
          gardent connaissance : publiez un rectificatif si le contenu était erroné.
        </p>
        <ZoneTexte
          libelle="Motif"
          requis
          rows={3}
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          erreur={erreurMotif}
          placeholder="Date de réunion erronée"
        />
      </Modale>
    </>
  )
}
