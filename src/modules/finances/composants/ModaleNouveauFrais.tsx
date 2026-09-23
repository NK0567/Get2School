import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Bouton, CaseACocher, Champ, Modale, Selecteur, useToast } from '../../../ui'
import { SelecteurClasse, texteRequis } from '../../../communs'
import { LIBELLE_PORTEE_FRAIS } from '../api'
import { useCreerFrais } from '../hooks/useFinances'
import { NIVEAUX_CONNUS } from '../../classes/api'

const schemaTranche = z.object({
  label: texteRequis('Le libellé de la tranche', 1),
  amount: z.coerce.number().min(1, 'Le montant doit être supérieur à zéro.'),
  dueDate: z.string().min(1, "La date d'échéance est obligatoire."),
})

const schema = z.object({
  label: texteRequis('Le libellé du frais', 2),
  scope: z.enum(['ALL', 'LEVEL', 'CLASS']),
  scopeRef: z.string().optional(),
  isMandatory: z.boolean(),
  installments: z.array(schemaTranche).min(1, 'Ajoutez au moins une tranche.'),
})

type EntreeFormulaire = z.input<typeof schema>
type Formulaire = z.output<typeof schema>

export function ModaleNouveauFrais({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const toast = useToast()
  const creer = useCreerFrais()

  const { register, handleSubmit, formState, reset, setValue, control } = useForm<
    EntreeFormulaire,
    unknown,
    Formulaire
  >({
    resolver: zodResolver(schema),
    defaultValues: {
      label: '',
      scope: 'ALL',
      scopeRef: '',
      isMandatory: true,
      installments: [{ label: 'Solde unique', amount: 0, dueDate: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'installments' })
  const scope = useWatch({ control, name: 'scope' })
  const scopeRef = useWatch({ control, name: 'scopeRef' })
  const isMandatory = useWatch({ control, name: 'isMandatory' })
  const installments = useWatch({ control, name: 'installments' })
  const montantTotal = (installments ?? []).reduce((s, t) => s + (Number(t?.amount) || 0), 0)

  const fermer = () => {
    reset()
    onFermer()
  }

  const envoyer = handleSubmit(async (valeurs) => {
    const montant = valeurs.installments.reduce((s, t) => s + t.amount, 0)
    try {
      await creer.mutateAsync({
        label: valeurs.label,
        scope: valeurs.scope,
        scopeRef: valeurs.scope === 'ALL' ? undefined : valeurs.scopeRef,
        amount: montant,
        isMandatory: valeurs.isMandatory,
        installments: valeurs.installments,
      })
      toast('succes', 'Le frais a été créé.')
      fermer()
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'La création a échoué.')
    }
  })

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Nouveau frais"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton chargement={creer.isPending} onClick={envoyer}>
            Créer le frais
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Champ
          libelle="Libellé"
          requis
          {...register('label')}
          erreur={formState.errors.label?.message}
          placeholder="Frais de scolarité annuel"
        />

        <div className="grid grid-cols-2 gap-4">
          <Selecteur
            libelle="Portée"
            requis
            value={scope}
            onChange={(e) => {
              setValue('scope', e.target.value as Formulaire['scope'])
              setValue('scopeRef', '')
            }}
            options={(Object.keys(LIBELLE_PORTEE_FRAIS) as Formulaire['scope'][]).map((s) => ({
              valeur: s,
              libelle: LIBELLE_PORTEE_FRAIS[s],
            }))}
          />
          {scope === 'LEVEL' && (
            <Selecteur
              libelle="Niveau"
              requis
              value={scopeRef ?? ''}
              onChange={(e) => setValue('scopeRef', e.target.value)}
              placeholder="Choisissez un niveau"
              options={NIVEAUX_CONNUS.map((n) => ({ valeur: n, libelle: n }))}
            />
          )}
          {scope === 'CLASS' && (
            <SelecteurClasse
              libelle="Classe"
              requis
              valeur={scopeRef ?? ''}
              onChange={(v) => setValue('scopeRef', v)}
            />
          )}
        </div>

        <CaseACocher
          libelle="Frais obligatoire"
          checked={isMandatory}
          onChange={(e) => setValue('isMandatory', e.target.checked)}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-ink text-[13px] font-medium">Échéancier</span>
            <Bouton
              variante="fantome"
              taille="sm"
              icone={<Plus className="h-3.5 w-3.5" />}
              onClick={() => append({ label: `Tranche ${fields.length + 1}`, amount: 0, dueDate: '' })}
            >
              Ajouter une tranche
            </Bouton>
          </div>
          <div className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_120px_140px_32px] items-start gap-2">
                <Champ
                  placeholder="Libellé"
                  {...register(`installments.${index}.label`)}
                  erreur={formState.errors.installments?.[index]?.label?.message}
                />
                <Champ
                  type="number"
                  min={1}
                  placeholder="Montant"
                  {...register(`installments.${index}.amount`)}
                  erreur={formState.errors.installments?.[index]?.amount?.message}
                />
                <Champ
                  type="date"
                  {...register(`installments.${index}.dueDate`)}
                  erreur={formState.errors.installments?.[index]?.dueDate?.message}
                />
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length <= 1}
                  className="text-muted hover:text-danger mt-2 transition disabled:opacity-30"
                  title="Retirer cette tranche"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {formState.errors.installments?.message && (
            <p className="text-danger mt-1 text-xs">{formState.errors.installments.message}</p>
          )}
          <p className="text-muted mt-2 text-[13px]">
            Montant total :{' '}
            <span className="text-ink font-semibold tabular-nums">
              {montantTotal.toLocaleString('fr-FR')} FCFA
            </span>
          </p>
        </div>
      </div>
    </Modale>
  )
}
