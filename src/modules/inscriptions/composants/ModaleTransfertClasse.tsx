import { useState } from 'react'
import { Bouton, Modale } from '../../../ui'
import { SelecteurClasse } from '../../../communs'
import type { Inscription } from '../../../socle/modeles/scolarite'

interface Props {
  inscription: Inscription | null
  onFermer: () => void
  onConfirmer: (classIdCible: string) => void
  chargement?: boolean
}

/** Mouvement interne, au sein de la même année scolaire : voir api.ts. */
export function ModaleTransfertClasse({ inscription, onFermer, onConfirmer, chargement }: Props) {
  const [classId, setClassId] = useState('')

  const fermer = () => {
    setClassId('')
    onFermer()
  }

  return (
    <Modale
      ouverte={inscription !== null}
      onFermer={fermer}
      titre="Transférer vers une autre classe"
      taille="sm"
      pied={
        <>
          <Bouton variante="secondaire" onClick={fermer}>
            Annuler
          </Bouton>
          <Bouton
            chargement={chargement}
            disabled={!classId || classId === inscription?.classId}
            onClick={() => {
              onConfirmer(classId)
              setClassId('')
            }}
          >
            Transférer
          </Bouton>
        </>
      }
    >
      <SelecteurClasse libelle="Classe de destination" requis valeur={classId} onChange={setClassId} />
    </Modale>
  )
}
