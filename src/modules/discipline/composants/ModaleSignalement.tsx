import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Alerte, Bouton, Champ, Modale, Selecteur, ZoneTexte, useToast } from '../../../ui'
import { SelecteurClasse } from '../../../communs'
import { api } from '../../../socle/api/client'
import type { Eleve, Inscription } from '../../../socle/modeles/scolarite'
import type { Page } from '../../../socle/modeles/communs'
import { LIBELLE_GRAVITE, LIBELLE_TYPE } from '../api'
import { useSignalerIncident } from '../hooks/useDiscipline'

const schema = z.object({
  classId: z.string().min(1, 'La classe est obligatoire.'),
  studentId: z.string().min(1, "L'élève est obligatoire."),
  date: z.string().min(1, 'La date est obligatoire.'),
  type: z.enum(['OBSERVATION', 'INCIDENT', 'WARNING', 'REPRIMAND', 'SANCTION', 'SUSPENSION']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  description: z.string().min(10, 'Décrivez les faits en quelques mots au minimum.'),
})

type Formulaire = z.infer<typeof schema>

const aujourdhui = () => new Date().toISOString().slice(0, 10)

export function ModaleSignalement({ ouverte, onFermer }: { ouverte: boolean; onFermer: () => void }) {
  const toast = useToast()
  const signaler = useSignalerIncident()

  const { register, handleSubmit, formState, reset, setValue, control } = useForm<Formulaire>({
    resolver: zodResolver(schema),
    defaultValues: {
      classId: '',
      studentId: '',
      date: aujourdhui(),
      type: 'OBSERVATION',
      severity: 'LOW',
      description: '',
    },
  })

  const classId = useWatch({ control, name: 'classId' })
  const studentId = useWatch({ control, name: 'studentId' })
  const type = useWatch({ control, name: 'type' })

  const { data: inscriptions } = useQuery({
    queryKey: ['inscriptions', classId],
    queryFn: async () => (await api.get<Inscription[]>('/enrollments', { params: { classId } })).data,
    enabled: Boolean(classId),
  })
  const { data: eleves } = useQuery({
    queryKey: ['eleves', 'discipline'],
    queryFn: async () => (await api.get<Page<Eleve>>('/students', { params: { taille: 500 } })).data,
    enabled: Boolean(inscriptions?.length),
  })

  const optionsEleves = (inscriptions ?? [])
    .map((i) => {
      const eleve = eleves?.contenu.find((e) => e.id === i.studentId)
      return eleve
        ? {
            valeur: i.studentId,
            libelle: `${eleve.matricule} · ${eleve.lastName.toUpperCase()} ${eleve.firstName}`,
            enrollmentId: i.id,
          }
        : null
    })
    .filter((o): o is NonNullable<typeof o> => o !== null)

  const fermer = () => {
    reset()
    onFermer()
  }

  const envoyer = handleSubmit(async (valeurs) => {
    const enrollmentId = optionsEleves.find((o) => o.valeur === valeurs.studentId)?.enrollmentId
    if (!enrollmentId) return
    try {
      await signaler.mutateAsync({ ...valeurs, enrollmentId })
      toast('succes', 'Le signalement a été enregistré.')
      fermer()
    } catch (e) {
      toast('danger', (e as { message?: string })?.message ?? 'Le signalement a échoué.')
    }
  })

  return (
    <Modale
      ouverte={ouverte}
      onFermer={fermer}
      titre="Signaler un incident"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton chargement={signaler.isPending} onClick={envoyer}>
            Enregistrer le signalement
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <SelecteurClasse
            libelle="Classe"
            requis
            valeur={classId}
            onChange={(v) => {
              setValue('classId', v, { shouldValidate: true })
              setValue('studentId', '')
            }}
          />
          <Selecteur
            libelle="Élève"
            requis
            disabled={!classId}
            value={studentId}
            onChange={(e) => setValue('studentId', e.target.value, { shouldValidate: true })}
            placeholder={classId ? 'Choisissez un élève' : "Choisissez d'abord une classe"}
            options={optionsEleves}
          />
        </div>
        <Champ
          libelle="Date"
          requis
          type="date"
          max={aujourdhui()}
          {...register('date')}
          erreur={formState.errors.date?.message}
        />
        <div className="grid grid-cols-2 gap-4">
          <Selecteur
            libelle="Type"
            requis
            {...register('type')}
            options={(Object.keys(LIBELLE_TYPE) as (keyof typeof LIBELLE_TYPE)[]).map((t) => ({
              valeur: t,
              libelle: LIBELLE_TYPE[t],
            }))}
          />
          <Selecteur
            libelle="Gravité"
            requis
            {...register('severity')}
            options={(Object.keys(LIBELLE_GRAVITE) as (keyof typeof LIBELLE_GRAVITE)[]).map((g) => ({
              valeur: g,
              libelle: LIBELLE_GRAVITE[g],
            }))}
          />
        </div>
        <ZoneTexte
          libelle="Description des faits"
          requis
          rows={4}
          {...register('description')}
          erreur={formState.errors.description?.message}
          placeholder="Ce qui s'est passé, où, et dans quelles circonstances"
        />

        {(type === 'SANCTION' || type === 'SUSPENSION') && (
          <Alerte ton="alerte">
            Ce signalement constate les faits. La sanction elle-même n'est jamais automatique : elle relève
            d'une décision distincte, prise par un responsable habilité, enregistrée séparément une fois le
            dossier examiné.
          </Alerte>
        )}
      </div>
    </Modale>
  )
}
