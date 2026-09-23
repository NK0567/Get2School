/**
 * Frais et échéances · lot B (Alida)
 */
import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { Badge, Bouton } from '../../../ui'
import type { Colonne } from '../../../ui'
import { GabaritListe, formaterDate, formaterMontant } from '../../../communs'
import type { Frais } from '../../../socle/modeles/finances'
import { LIBELLE_PORTEE_FRAIS } from '../api'
import { useFrais } from '../hooks/useFinances'
import { ModaleNouveauFrais } from '../composants/ModaleNouveauFrais'

export default function ListeFrais() {
  const requete = useFrais()
  const [creationOuverte, setCreationOuverte] = useState(false)

  const colonnes: Colonne<Frais>[] = [
    {
      cle: 'libelle',
      entete: 'Frais',
      rendu: (f) => (
        <div>
          <div className="text-ink font-medium">{f.label}</div>
          <div className="text-muted text-xs">
            {LIBELLE_PORTEE_FRAIS[f.scope]}
            {f.scopeRef ? ` · ${f.scopeRef}` : ''}
            {!f.isMandatory ? ' · Facultatif' : ''}
          </div>
        </div>
      ),
    },
    {
      cle: 'montant',
      entete: 'Montant',
      className: 'text-right',
      rendu: (f) => <span className="font-medium tabular-nums">{formaterMontant(f.amount)}</span>,
    },
    {
      cle: 'echeancier',
      entete: 'Échéancier',
      rendu: (f) => (
        <div className="flex flex-wrap gap-1">
          {f.installments.map((t) => (
            <Badge key={t.id} ton="neutre">
              {t.label} · {formaterDate(t.dueDate)}
            </Badge>
          ))}
        </div>
      ),
    },
  ]

  return (
    <>
      <GabaritListe
        titre="Frais et échéances"
        sousTitre={`${requete.data?.length ?? 0} frais défini(s) pour l'année en cours`}
        filAriane={['Scolarité', 'Finance']}
        actions={
          <Bouton icone={<Plus className="h-4 w-4" />} onClick={() => setCreationOuverte(true)}>
            Nouveau frais
          </Bouton>
        }
        chargement={requete.isLoading}
        erreur={requete.error}
        lignes={requete.data}
        colonnes={colonnes}
        cleLigne={(f) => f.id}
        vide={{
          titre: 'Aucun frais défini',
          description: "Créez le premier frais de l'année scolaire, avec son échéancier.",
          icone: <Wallet className="h-8 w-8" />,
          action: <Bouton onClick={() => setCreationOuverte(true)}>Nouveau frais</Bouton>,
        }}
      />

      <ModaleNouveauFrais ouverte={creationOuverte} onFermer={() => setCreationOuverte(false)} />
    </>
  )
}
