import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../../socle/api/client'
import type { Etablissement } from '../../socle/modeles/administration'
import { Bouton } from '../../ui'
import { formaterDate } from '../formats'

interface Props {
  /** Référence unique du document, ex. LBK-BUL-2026-00317 (RG-17). */
  reference: string
  typeLibelle: string
  anneeScolaire?: string
  children: ReactNode
}

/**
 * Gabarit de document imprimable · PROPRIETAIRE : Boris
 *
 * Format A4, en-tête institutionnel, QR code de vérification. Tous les
 * documents du projet passent par ici : bulletin, reçu, certificat, liste.
 * Le QR contient uniquement une URL de vérification, jamais une donnée
 * personnelle, une note ou un montant.
 */
export function GabaritDocument({ reference, typeLibelle, anneeScolaire, children }: Props) {
  const { data: etablissement } = useQuery({
    queryKey: ['etablissement'],
    queryFn: async () => (await api.get<Etablissement>('/establishments/current')).data,
  })

  const urlVerification = `${location.origin}/v/${reference}`

  return (
    <>
      <div className="mb-4 flex justify-end print:hidden">
        <Bouton icone={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
          Imprimer
        </Bouton>
      </div>

      <div className="text-ink mx-auto w-full max-w-[794px] bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        {/* En-tete institutionnel */}
        <div className="border-ink flex items-start justify-between border-b-2 pb-4">
          <div>
            <div className="text-lg font-bold uppercase">{etablissement?.name}</div>
            {etablissement?.slogan && <div className="text-muted text-xs italic">{etablissement.slogan}</div>}
            <div className="text-muted mt-1 text-[11px] leading-relaxed">
              {etablissement?.address}
              <br />
              {etablissement?.phone} · {etablissement?.email}
            </div>
          </div>
          <div className="text-right">
            <QRCodeSVG value={urlVerification} size={72} level="M" />
            <div className="text-muted mt-1 text-[9px]">Vérification</div>
          </div>
        </div>

        {/* Titre du document */}
        <div className="my-6 text-center">
          <h2 className="text-xl font-bold tracking-wide uppercase">{typeLibelle}</h2>
          {anneeScolaire && (
            <div className="text-muted mt-0.5 text-[13px]">Annee scolaire {anneeScolaire}</div>
          )}
        </div>

        {/* Corps du document */}
        <div className="text-[13px]">{children}</div>

        {/* Pied */}
        <div className="border-line text-muted mt-8 flex items-end justify-between border-t pt-3 text-[10px]">
          <span>Reference : {reference}</span>
          <span>Emis le {formaterDate(new Date().toISOString())}</span>
        </div>
      </div>
    </>
  )
}
