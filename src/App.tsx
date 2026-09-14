import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'
import { definirGestionnaireExpiration } from './socle/api/client'
import { useSession } from './socle/etat/useSession'
import { routeur } from './routes'
import { FournisseurToast } from './ui'

const client = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
})

// Une réponse 401 sur une requête authentifiée signifie que le jeton n'est
// plus valable. On ferme la session localement plutôt que de laisser
// l'utilisateur enchaîner des écrans vides sans comprendre pourquoi.
definirGestionnaireExpiration(() => {
  if (useSession.getState().utilisateur) {
    useSession.getState().deconnecter('EXPIRATION')
    client.clear()
  }
})

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <FournisseurToast>
        <RouterProvider router={routeur} />
      </FournisseurToast>
    </QueryClientProvider>
  )
}
