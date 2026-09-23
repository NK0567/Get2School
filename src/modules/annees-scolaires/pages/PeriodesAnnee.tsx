import { useState } from 'react'
import { ArrowLeft, Lock, LockOpen } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Alerte, Bouton, DialogueConfirmation, EnteteDePage, SqueletteTableau, useToast } from '../../../ui'
import { BadgeStatut, formaterDate } from '../../../communs'
import type { Periode } from '../../../socle/modeles/administration'
import { useAnneeScolaire, useBasculerVerrou } from '../hooks/useAnneesScolaires'
import { ModaleDeverrouillage } from '../composants/ModaleDeverrouillage'

export default function PeriodesAnnee() {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const requete = useAnneeScolaire(id)
  const basculer = useBasculerVerrou()

  const [aVerrouiller, setAVerrouiller] = useState<Periode | null>(null)
  const [aDeverrouiller, setADeverrouiller] = useState<Periode | null>(null)

  if (requete.isLoading) return <SqueletteTableau lignes={3} colonnes={4} />
  if (!requete.data) return null

  const annee = requete.data
  const cloturee = annee.status === 'CLOSED'

  return (
    <>
      <Link
        to="/annees-scolaires"
        className="text-muted hover:text-ink mb-3 inline-flex items-center gap-1.5 text-[13px] transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux années scolaires
      </Link>

      <EnteteDePage
        titre={`Périodes · ${annee.label}`}
        sousTitre={`${formaterDate(annee.startDate)} au ${formaterDate(annee.endDate)}`}
        filAriane={['Administration', 'Années scolaires']}
        actions={<BadgeStatut valeur={annee.status} />}
      />

      {cloturee && (
        <Alerte ton="info">
          Cette année est clôturée. Ses périodes restent verrouillées et ses données sont consultables mais
          non modifiables.
        </Alerte>
      )}

      <div className="flex flex-col gap-3">
        {annee.periods.map((periode) => (
          <div
            key={periode.id}
            className="border-line bg-surface flex items-center justify-between rounded-xl border px-5 py-4"
          >
            <div className="flex items-center gap-4">
              <div
                className={
                  periode.isLocked
                    ? 'bg-muted/10 text-muted flex h-9 w-9 items-center justify-center rounded-lg'
                    : 'bg-success/10 text-success flex h-9 w-9 items-center justify-center rounded-lg'
                }
              >
                {periode.isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
              </div>
              <div>
                <div className="text-ink font-medium">{periode.label}</div>
                <div className="text-muted text-xs tabular-nums">
                  {formaterDate(periode.startDate)} au {formaterDate(periode.endDate)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BadgeStatut
                valeur={periode.isLocked ? 'CLOSED' : 'OPEN'}
                libelle={periode.isLocked ? 'Verrouillée' : 'Ouverte'}
              />
              <Bouton
                variante={periode.isLocked ? 'danger' : 'secondaire'}
                taille="sm"
                disabled={cloturee}
                title={cloturee ? 'Année clôturée' : undefined}
                onClick={() => (periode.isLocked ? setADeverrouiller(periode) : setAVerrouiller(periode))}
              >
                {periode.isLocked ? 'Déverrouiller' : 'Verrouiller'}
              </Bouton>
            </div>
          </div>
        ))}
      </div>

      <p className="text-muted mt-4 text-xs">
        Une période verrouillée interdit toute création et toute modification de note. Seul le Super
        Administrateur peut la rouvrir, avec un motif enregistré dans le journal d'audit.
      </p>

      <DialogueConfirmation
        ouverte={aVerrouiller !== null}
        onFermer={() => setAVerrouiller(null)}
        titre={`Verrouiller ${aVerrouiller?.label ?? ''}`}
        destructif={false}
        message="Les enseignants ne pourront plus saisir ni modifier de note sur cette période. Les moyennes et les bulletins deviennent définitifs."
        libelleAction="Verrouiller la période"
        chargement={basculer.isPending}
        onConfirmer={async () => {
          if (!aVerrouiller) return
          await basculer.mutateAsync({ periode: aVerrouiller, anneeLabel: annee.label })
          toast('succes', `${aVerrouiller.label} est verrouillée.`)
          setAVerrouiller(null)
        }}
      />

      <ModaleDeverrouillage
        periode={aDeverrouiller}
        onFermer={() => setADeverrouiller(null)}
        chargement={basculer.isPending}
        onConfirmer={async (motif) => {
          if (!aDeverrouiller) return
          await basculer.mutateAsync({ periode: aDeverrouiller, anneeLabel: annee.label, motif })
          toast('alerte', `${aDeverrouiller.label} est de nouveau ouverte a la saisie.`)
          setADeverrouiller(null)
        }}
      />
    </>
  )
}
