import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'
import { routeur } from './routes'
import { FournisseurToast } from './ui'

const client = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
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
