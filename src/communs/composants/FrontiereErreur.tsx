import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Bouton } from '../../ui'

interface Props {
  children: ReactNode
}

interface Etat {
  erreur: Error | null
}

/**
 * Empeche qu'une erreur dans un module fasse tomber toute l'application.
 * Un plantage chez Fabrice ne doit pas rendre les écrans d'Alida inaccessibles
 * pendant une demonstration.
 */
export class FrontiereErreur extends Component<Props, Etat> {
  state: Etat = { erreur: null }

  static getDerivedStateFromError(erreur: Error): Etat {
    return { erreur }
  }

  componentDidCatch(erreur: Error, infos: ErrorInfo) {
    console.error('Erreur non interceptee :', erreur, infos.componentStack)
  }

  render() {
    if (!this.state.erreur) return this.props.children

    return (
      <div className="border-line bg-surface flex flex-col items-center justify-center gap-3 rounded-xl border px-6 py-16 text-center">
        <TriangleAlert className="text-danger h-8 w-8" />
        <div>
          <p className="text-ink text-sm font-semibold">Cet écran à rencontre une erreur</p>
          <p className="text-muted mt-1 max-w-md text-[13px]">
            Le reste de l'application reste utilisable. Signalez le probleme au responsable du module.
          </p>
        </div>
        <code className="bg-canvas text-danger max-w-lg rounded px-3 py-2 text-xs break-words">
          {this.state.erreur.message}
        </code>
        <Bouton variante="secondaire" onClick={() => this.setState({ erreur: null })}>
          Reessayer
        </Bouton>
      </div>
    )
  }
}
