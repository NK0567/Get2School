import type { ReactNode } from 'react'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'
import { cn, EnteteDePage } from '../../ui'

export interface OngletFiche {
  cle: string
  libelle: string
  contenu: ReactNode
}

interface Props {
  titre: string
  sousTitre?: string
  filAriane?: string[]
  retour?: string
  badges?: ReactNode
  actions?: ReactNode
  onglets: OngletFiche[]
}

/**
 * Gabarit de fiche a onglets · PROPRIETAIRE : Boris
 *
 * Sert notamment a la fiche eleve, qui est alimentee par les trois lots :
 * chacun fournit son onglet sans toucher aux autres.
 */
export function GabaritFiche({ titre, sousTitre, filAriane, retour, badges, actions, onglets }: Props) {
  const naviguer = useNavigate()

  return (
    <>
      {retour && (
        <button
          onClick={() => naviguer(retour)}
          className="text-muted hover:text-ink mb-3 inline-flex items-center gap-1.5 text-[13px] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      )}

      <EnteteDePage
        titre={titre}
        sousTitre={sousTitre}
        filAriane={filAriane}
        actions={
          <>
            {badges}
            {actions}
          </>
        }
      />

      <TabGroup>
        <TabList className="border-line mb-4 flex gap-1 border-b">
          {onglets.map((o) => (
            <Tab
              key={o.cle}
              className={({ selected }) =>
                cn(
                  '-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition outline-none',
                  selected ? 'border-primary text-primary' : 'text-muted hover:text-ink border-transparent',
                )
              }
            >
              {o.libelle}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {onglets.map((o) => (
            <TabPanel key={o.cle}>{o.contenu}</TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </>
  )
}
